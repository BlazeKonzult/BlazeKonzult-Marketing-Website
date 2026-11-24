import crypto from 'crypto';
import { db } from './db';
import { audit } from './auth';
import { ApiError } from './http';
import { Settings } from './settings';
import { estimateMinutes, options, isRequired, Snapshot, validateSnapshot, Question, Category, Rule } from './engine';
import { pick, SPECIAL, Loc } from './i18n';

export type TemplateRow = { id: number; slug: string; status: string; data: any; current_version_id: number | null };

export const Templates = {
  async row(id: number): Promise<TemplateRow> {
    const t = await db.one('SELECT * FROM templates WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!t) throw new ApiError('Assessment type not found', 'not_found', 404);
    return { ...t, data: JSON.parse(t.data) } as TemplateRow;
  },

  async bySlug(slug: string): Promise<TemplateRow | null> {
    const t = await db.one('SELECT * FROM templates WHERE slug = ? AND deleted_at IS NULL', [slug]);
    return t ? ({ ...t, data: JSON.parse(t.data) } as TemplateRow) : null;
  },

  /** Snapshot from the current working configuration (preview + publishing). */
  async buildSnapshot(templateId: number, includeDrafts = false): Promise<Snapshot> {
    const t = await Templates.row(templateId);
    const d = t.data;
    const rows = await db.all(`SELECT q.code, q.data, tq.sort, tq.overrides FROM template_questions tq JOIN questions q ON q.id = tq.question_id
      WHERE tq.template_id = ? AND q.status IN (${includeDrafts ? "'published','draft'" : "'published'"}) ORDER BY tq.sort, q.id`, [templateId]);
    const used = new Set<string>();
    let questions: (Question & { _pos?: number })[] = rows.map((r, i) => {
      const q = { ...JSON.parse(r.data), code: r.code, _pos: i } as Question & { _pos: number };
      const o = r.overrides ? JSON.parse(r.overrides) : {};
      if (o.weight !== undefined) q.weight = o.weight;
      if (o.required !== undefined) q.required = o.required;
      used.add(q.category);
      return q;
    });
    const cats: Category[] = (await db.all('SELECT `key`, data FROM categories'))
      .filter((c) => used.has(c.key)).map((c) => ({ key: c.key, ...JSON.parse(c.data) }))
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    const order = new Map(cats.map((c, i) => [c.key, i]));
    questions = questions.sort((a, b) => ((order.get(a.category) ?? 99) - (order.get(b.category) ?? 99)) || (a._pos! - b._pos!)).map(({ _pos, ...q }) => q);
    const rules: Rule[] = (await db.all('SELECT code, data FROM recommendation_rules WHERE active = 1 ORDER BY code'))
      .map((r) => ({ code: r.code, ...JSON.parse(r.data) }))
      .filter((r) => !r.templates?.length || r.templates.includes(t.slug));
    return {
      schema: 1,
      template: {
        slug: t.slug, name: d.name ?? { en: t.slug }, summary: d.summary ?? { en: '' }, audience: d.audience, evaluates: d.evaluates ?? [],
        settings: {
          unsure_policy: d.settings?.unsure_policy ?? (await Settings.get('unsure_policy')),
          strength_threshold: d.settings?.strength_threshold ?? (await Settings.get('strength_threshold')),
          max_recommendations: d.settings?.max_recommendations ?? (await Settings.get('max_recommendations')),
        },
        thresholds: d.thresholds?.length ? d.thresholds : await Settings.get('thresholds'),
      },
      categories: cats, questions, rules,
    };
  },

  /** Publish an immutable version. No-op (no new version) if nothing changed since the last publish. */
  async publish(templateId: number, userId: number | null) {
    const snap = await Templates.buildSnapshot(templateId);
    const errors = validateSnapshot(snap);
    if (errors.length) throw new ApiError('This assessment cannot be published yet.', 'invalid_config', 422, { errors });
    const json = JSON.stringify(snap);
    const checksum = crypto.createHash('sha256').update(json).digest('hex');
    return db.tx(async (cx) => {
      const t = await db.one('SELECT * FROM templates WHERE id = ? AND deleted_at IS NULL FOR UPDATE', [templateId], cx);
      if (!t) throw new ApiError('Assessment type not found', 'not_found', 404);
      const cur = t.current_version_id ? await db.one('SELECT id, version, checksum FROM template_versions WHERE id = ?', [t.current_version_id], cx) : null;
      if (cur && cur.checksum === checksum) {
        await db.update('templates', { status: 'published' }, 'id = ?', [templateId], cx);
        return { version_id: cur.id as number, version: cur.version as number, changed: false };
      }
      const version = Number(await db.val('SELECT COALESCE(MAX(version), 0) + 1 FROM template_versions WHERE template_id = ?', [templateId], cx));
      const vid = await db.insert('template_versions', { template_id: templateId, version, snapshot: json, checksum, published_by: userId }, cx);
      await db.update('templates', { current_version_id: vid, status: 'published' }, 'id = ?', [templateId], cx);
      await audit(userId, 'template.publish', 'template', templateId, { version });
      return { version_id: vid, version, changed: true };
    });
  },

  async snapshotByVersion(versionId: number): Promise<Snapshot> {
    const v = await db.one('SELECT snapshot FROM template_versions WHERE id = ?', [versionId]);
    if (!v) throw new ApiError('Assessment version not found', 'not_found', 404);
    return JSON.parse(v.snapshot);
  },

  async versionRow(versionId: number) {
    return db.one<{ id: number; template_id: number; version: number; checksum: string; published_at: string }>(
      'SELECT id, template_id, version, checksum, published_at FROM template_versions WHERE id = ?', [versionId]);
  },

  async publicList(l: Loc) {
    const rows = await db.all(`SELECT t.slug, t.data, v.version, v.snapshot FROM templates t JOIN template_versions v ON v.id = t.current_version_id
      WHERE t.status = 'published' AND t.deleted_at IS NULL`);
    return rows.map((r) => {
      const snap = JSON.parse(r.snapshot) as Snapshot;
      const d = JSON.parse(r.data);
      return { slug: r.slug, name: pick(snap.template.name, l), summary: pick(snap.template.summary, l), minutes: estimateMinutes(snap),
        questions: snap.questions.length, version: r.version, sort: Number(d.sort ?? 99) };
    }).sort((a, b) => a.sort - b.sort);
  },

  /** Localized payload to run an assessment. Scores, weights and rules stay on the server. */
  clientPayload(s: Snapshot, versionId: number, version: number, l: Loc) {
    return {
      slug: s.template.slug, version_id: versionId, version, locale: l,
      name: pick(s.template.name, l), summary: pick(s.template.summary, l), minutes: estimateMinutes(s),
      categories: s.categories.map((c) => ({ key: c.key, name: pick(c.name, l), description: pick(c.description, l) })),
      questions: s.questions.map((q) => ({
        code: q.code, category: q.category, type: q.type, title: pick(q.title, l), description: pick(q.description, l),
        options: options(q).map((o) => ({ value: o.value, label: pick(o.label, l) })),
        allow_na: !!q.allow_na, allow_unsure: !!q.allow_unsure, required: isRequired(q), condition: q.condition ?? null,
        min: q.min ?? null, max: q.max ?? null, unit: q.unit ? pick(q.unit, l) : null,
      })),
      special: { na: pick(SPECIAL.na, l), unsure: pick(SPECIAL.unsure, l) },
    };
  },
};
