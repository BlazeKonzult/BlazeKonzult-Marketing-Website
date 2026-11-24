import express, { Router, Request } from 'express';
import { Content, checkKey } from '../content';
import { Media, MAX_BYTES } from '../media';
import { db, now } from '../db';
import { h, ApiError, int, str, isEmail, locale, oneLine, bool } from '../http';
import { Auth, audit, requireCap, ROLES, Role } from '../auth';
import { Crypto, Password, Token } from '../security';
import { Settings, DEFAULTS, SettingKey } from '../settings';
import { Templates } from '../templates';
import { Assessments } from '../assessments';
import { Leads, STATUSES, reportUrl } from '../leads';
import { buildReport } from '../report';
import { analytics, runRetention } from '../analytics';
import { Mailer } from '../mailer';
import { evaluate, validate, validateSnapshot, validateThresholds, Question, Category, Rule, TYPES, Snapshot } from '../engine';
import { SERVICES, Loc } from '../i18n';
import { commandRouter } from '../command';

export const adminRouter = Router();
// Command Centre routes first: /leads/pipeline and /leads/bulk must win over /leads/:id.
adminRouter.use(commandRouter);
const uid = (req: Request) => req.user!.id;
const id = (req: Request) => { const n = int(req.params.id); if (n <= 0) throw new ApiError('Not found', 'not_found', 404); return n; };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE = /^[a-z][a-z0-9_]{1,59}$/;
const page = (req: Request) => { const p = Math.max(1, int(req.query.page, 1)); const size = Math.min(200, Math.max(10, int(req.query.size, 50))); return { size, offset: (p - 1) * size, page: p }; };
const json = (v: unknown) => JSON.stringify(v ?? null);
const parse = (s: string | null) => (s ? JSON.parse(s) : null);
const csvCell = (v: unknown) => { let s = v === null || v === undefined ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
function obj(v: unknown, field: string): any { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new ApiError(`${field} must be an object`, 'validation', 422, { field }); return v; }

/* ------------------------------- Auth ------------------------------- */
adminRouter.post('/login', h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const email = str(req.body, 'email', 190, true)!; const password = str(req.body, 'password', 200, true)!;
  return Auth.login(req, res, email, password);
}));
adminRouter.post('/login/setup', h(async (req, res) => { res.set('Cache-Control', 'no-store'); return Auth.setup(req, req.body?.challenge); }));
adminRouter.post('/login/verify', h(async (req, res) => { res.set('Cache-Control', 'no-store'); return Auth.verify(req, res, req.body); }));
adminRouter.post('/logout', h(async (req, res) => { await Auth.logout(req, res); return { ok: true }; }));
adminRouter.get('/mfa', requireCap('view'), h(async (req) => Auth.mfaStatus(req, uid(req))));
adminRouter.post('/mfa/recovery-codes', requireCap('view'), h(async (req, res) => { res.set('Cache-Control', 'no-store'); return Auth.regenerateRecovery(uid(req), String(req.body?.code ?? '')); }));
adminRouter.delete('/mfa/devices', requireCap('view'), h(async (req, res) => { await Auth.forgetDevices(res, uid(req), req.query.id ? String(req.query.id) : undefined); return { ok: true }; }));
adminRouter.get('/me', h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const s = await Auth.session(req);
  if (!s) throw new ApiError('Please sign in.', 'unauthenticated', 401);
  return { user: Auth.publicUser(s.user), csrf: s.csrf };
}));
adminRouter.post('/password', requireCap('view'), h(async (req) => {
  const cur = str(req.body, 'current', 200, true)!; const next = str(req.body, 'password', 200, true)!;
  const u = await db.one('SELECT password_hash FROM users WHERE id = ?', [uid(req)]);
  if (!u || !Password.verify(cur, u.password_hash)) throw new ApiError('Current password is incorrect.', 'validation', 422, { field: 'current' });
  Password.validate(next);
  await db.update('users', { password_hash: Password.hash(next) }, 'id = ?', [uid(req)]);
  await audit(uid(req), 'user.password_changed', 'user', uid(req));
  return { ok: true };
}));

/* ------------------------------ Overview ------------------------------ */
adminRouter.get('/overview', requireCap('view'), h(async (req) => {
  const from = now(-30 * 86400).slice(0, 10);
  const a = await analytics({ from });
  const leadCounts = await db.all("SELECT status, COUNT(*) n FROM leads GROUP BY status");
  const recent = req.user && ['owner', 'admin', 'sales'].includes(req.user.role)
    ? (await db.all('SELECT * FROM leads ORDER BY id DESC LIMIT 8')).map((l) => { const d = Leads.decrypt(l); return { id: d.id, ref: d.ref, company: d.company, source: d.source, status: d.status, priority: d.priority, created_at: d.created_at }; })
    : [];
  const mailFailed = Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'failed'"));
  const mailQueued = Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'queued'"));
  return { period_days: 30, analytics: a, lead_status: leadCounts.map((r) => ({ status: r.status, n: Number(r.n) })), recent_leads: recent, mail: { queued: mailQueued, failed: mailFailed },
    templates: Number(await db.val("SELECT COUNT(*) FROM templates WHERE status = 'published' AND deleted_at IS NULL")) };
}));

/* ------------------------------ Templates ------------------------------ */
function templateData(body: any, existing: any = {}) {
  const d = { ...existing, ...obj(body?.data ?? {}, 'data') };
  if (!d.name?.en) throw new ApiError('An English name is required.', 'validation', 422, { field: 'name' });
  if (d.thresholds?.length) { const e = validateThresholds(d.thresholds); if (e.length) throw new ApiError(e[0], 'validation', 422, { errors: e }); }
  if (d.settings?.unsure_policy && !['zero', 'exclude'].includes(d.settings.unsure_policy)) throw new ApiError('Invalid unsure policy', 'validation', 422);
  if (JSON.stringify(d).length > 100_000) throw new ApiError('Template data too large', 'validation', 422);
  return d;
}

adminRouter.get('/templates', requireCap('view'), h(async (req) => {
  const rows = await db.all(`SELECT t.*, v.version, v.published_at,
      (SELECT COUNT(*) FROM template_questions tq WHERE tq.template_id = t.id) questions,
      (SELECT COUNT(*) FROM assessments a WHERE a.template_id = t.id) completions
    FROM templates t LEFT JOIN template_versions v ON v.id = t.current_version_id
    WHERE t.deleted_at IS NULL ${req.query.archived ? '' : "AND t.status <> 'archived'"} ORDER BY t.id`);
  return { templates: rows.map((t) => ({ id: t.id, slug: t.slug, status: t.status, data: parse(t.data), version: t.version, published_at: t.published_at, questions: Number(t.questions), completions: Number(t.completions), updated_at: t.updated_at })) };
}));

adminRouter.get('/templates/:id', requireCap('view'), h(async (req) => {
  const t = await Templates.row(id(req));
  const qs = await db.all(`SELECT q.id, q.code, q.status, q.data, tq.sort, tq.overrides FROM template_questions tq JOIN questions q ON q.id = tq.question_id WHERE tq.template_id = ? ORDER BY tq.sort, q.id`, [t.id]);
  const versions = await db.all('SELECT id, version, checksum, published_at, published_by FROM template_versions WHERE template_id = ? ORDER BY version DESC', [t.id]);
  let errors: string[] = [];
  try { errors = validateSnapshot(await Templates.buildSnapshot(t.id)); } catch (e) { errors = [(e as Error).message]; }
  return { template: t, questions: qs.map((q) => ({ id: q.id, code: q.code, status: q.status, data: parse(q.data), sort: q.sort, overrides: parse(q.overrides) ?? {} })), versions, publish_errors: errors };
}));

adminRouter.post('/templates', requireCap('content'), h(async (req) => {
  const slug = str(req.body, 'slug', 80, true)!.toLowerCase();
  if (!SLUG.test(slug)) throw new ApiError('Slug may only contain lowercase letters, numbers and hyphens.', 'validation', 422, { field: 'slug' });
  if (await db.val('SELECT id FROM templates WHERE slug = ?', [slug])) throw new ApiError('This slug is already in use.', 'conflict', 409, { field: 'slug' });
  const data = templateData(req.body);
  const tid = await db.insert('templates', { slug, status: 'draft', data: json(data) });
  await audit(uid(req), 'template.create', 'template', tid, { slug });
  return { id: tid };
}));

adminRouter.put('/templates/:id', requireCap('content'), h(async (req) => {
  const t = await Templates.row(id(req));
  const data = templateData(req.body, req.body?.replace ? {} : t.data);
  await db.update('templates', { data: json(data) }, 'id = ?', [t.id]);
  await audit(uid(req), 'template.update', 'template', t.id);
  return { ok: true };
}));

/** Replace the question mapping: [{ code, overrides?: { weight?, required? } }] in display order. */
adminRouter.put('/templates/:id/questions', requireCap('content'), h(async (req) => {
  const t = await Templates.row(id(req));
  const list = Array.isArray(req.body?.questions) ? req.body.questions : null;
  if (!list || list.length > 300) throw new ApiError('questions must be a list', 'validation', 422);
  const resolved: [number, string | null][] = [];
  for (const item of list) {
    const qid = await db.val<number>("SELECT id FROM questions WHERE code = ? AND status <> 'archived'", [String(item?.code ?? '')]);
    if (!qid) throw new ApiError(`Unknown question: ${String(item?.code ?? '')}`, 'validation', 422);
    const o: any = {};
    if (item.overrides?.weight !== undefined && item.overrides.weight !== null) { const w = Number(item.overrides.weight); if (!(w > 0 && w <= 10)) throw new ApiError('Weight must be between 0 and 10', 'validation', 422); o.weight = w; }
    if (item.overrides?.required !== undefined && item.overrides.required !== null) o.required = !!item.overrides.required;
    resolved.push([qid, Object.keys(o).length ? json(o) : null]);
  }
  await db.tx(async (cx) => {
    await db.run('DELETE FROM template_questions WHERE template_id = ?', [t.id], cx);
    let s = 0;
    for (const [qid, o] of resolved) await db.run('INSERT IGNORE INTO template_questions (template_id, question_id, sort, overrides) VALUES (?, ?, ?, ?)', [t.id, qid, (s += 10), o], cx);
  });
  await audit(uid(req), 'template.questions', 'template', t.id, { count: resolved.length });
  return { ok: true };
}));

adminRouter.post('/templates/:id/publish', requireCap('publish'), h(async (req) => Templates.publish(id(req), uid(req))));
adminRouter.post('/templates/:id/unpublish', requireCap('publish'), h(async (req) => {
  const t = await Templates.row(id(req));
  await db.update('templates', { status: 'unpublished' }, 'id = ?', [t.id]);
  await audit(uid(req), 'template.unpublish', 'template', t.id);
  return { ok: true };
}));
adminRouter.post('/templates/:id/archive', requireCap('publish'), h(async (req) => {
  const t = await Templates.row(id(req));
  await db.update('templates', { status: 'archived' }, 'id = ?', [t.id]);
  await audit(uid(req), 'template.archive', 'template', t.id);
  return { ok: true };
}));
adminRouter.post('/templates/:id/duplicate', requireCap('content'), h(async (req) => {
  const t = await Templates.row(id(req));
  const slug = str(req.body, 'slug', 80, true)!.toLowerCase();
  if (!SLUG.test(slug)) throw new ApiError('Invalid slug', 'validation', 422, { field: 'slug' });
  if (await db.val('SELECT id FROM templates WHERE slug = ?', [slug])) throw new ApiError('This slug is already in use.', 'conflict', 409, { field: 'slug' });
  const data = { ...t.data, name: { en: `${t.data.name?.en ?? t.slug} (copy)`, nl: t.data.name?.nl ? `${t.data.name.nl} (kopie)` : undefined } };
  const nid = await db.insert('templates', { slug, status: 'draft', data: json(data) });
  await db.run('INSERT INTO template_questions (template_id, question_id, sort, overrides) SELECT ?, question_id, sort, overrides FROM template_questions WHERE template_id = ?', [nid, t.id]);
  await audit(uid(req), 'template.duplicate', 'template', nid, { from: t.slug });
  return { id: nid };
}));
/** Soft delete: completed assessments keep their immutable version snapshot. */
adminRouter.delete('/templates/:id', requireCap('delete'), h(async (req) => {
  const t = await Templates.row(id(req));
  await db.update('templates', { deleted_at: now(), status: 'archived', slug: `${t.slug}--deleted-${Date.now()}`.slice(0, 80) }, 'id = ?', [t.id]);
  await audit(uid(req), 'template.delete', 'template', t.id, { slug: t.slug });
  return { ok: true };
}));
adminRouter.get('/templates/:id/preview', requireCap('view'), h(async (req) => {
  const t = await Templates.row(id(req));
  const snap = await Templates.buildSnapshot(t.id, true);
  return { errors: validateSnapshot(snap), payload: Templates.clientPayload(snap, 0, 0, locale(req.query.locale)) };
}));
/** Dry-run scoring of the working configuration (nothing is stored). */
adminRouter.post('/templates/:id/preview/evaluate', requireCap('view'), h(async (req) => {
  const snap = await Templates.buildSnapshot(id(req), true);
  const [clean, errors] = validate(snap, obj(req.body?.answers ?? {}, 'answers'));
  return { errors, result: evaluate(snap, clean) };
}));
adminRouter.get('/versions/:id', requireCap('view'), h(async (req) => ({ version: await Templates.versionRow(id(req)), snapshot: await Templates.snapshotByVersion(id(req)) })));

/* ---------------------------- Question bank ---------------------------- */
function checkQuestion(q: any): Question {
  obj(q, 'question');
  const errs: string[] = [];
  if (!TYPES.includes(q.type)) errs.push('Unknown question type');
  if (!q.title?.en) errs.push('English title is required');
  if (!q.category) errs.push('Category is required');
  const fake: Snapshot = { schema: 1, template: { slug: 'x', name: { en: 'x' }, summary: { en: '' }, settings: { unsure_policy: 'zero', strength_threshold: 75, max_recommendations: 8 }, thresholds: DEFAULTS.thresholds },
    categories: [{ key: q.category, name: { en: 'x' } }], questions: [{ ...q, code: q.code ?? 'q', condition: null, scored: q.scored }], rules: [] };
  if (q.scored === false) fake.questions.push({ code: 'zz', category: q.category, type: 'maturity', title: { en: 'x' } });
  errs.push(...validateSnapshot(fake).filter((e) => !e.includes('no scored questions')));
  if (q.condition) {
    if (!Array.isArray(q.condition.rules)) errs.push('Condition rules must be a list');
    else for (const r of q.condition.rules) if (!r?.q || !['in', 'not_in', 'gte', 'lte', 'answered', 'not_answered'].includes(r.op)) errs.push('Invalid condition rule');
  }
  if (q.critical && q.critical.max_score !== undefined && !(q.critical.max_score >= 0 && q.critical.max_score <= 4)) errs.push('Critical threshold must be between 0 and 4');
  if (JSON.stringify(q).length > 50_000) errs.push('Question too large');
  if (errs.length) throw new ApiError(errs[0], 'validation', 422, { errors: [...new Set(errs)] });
  return q;
}
async function categoryExists(key: string) { if (!(await db.val('SELECT id FROM categories WHERE `key` = ?', [key]))) throw new ApiError(`Category '${key}' does not exist`, 'validation', 422, { field: 'category' }); }

adminRouter.get('/questions', requireCap('view'), h(async (req) => {
  const w = ['1=1']; const p: unknown[] = [];
  if (req.query.status) { w.push('q.status = ?'); p.push(String(req.query.status)); } else w.push("q.status <> 'archived'");
  if (req.query.q) { w.push('(q.code LIKE ? OR q.data LIKE ?)'); const s = `%${String(req.query.q).slice(0, 80)}%`; p.push(s, s); }
  const rows = await db.all(`SELECT q.*, (SELECT COUNT(*) FROM template_questions tq WHERE tq.question_id = q.id) used FROM questions q WHERE ${w.join(' AND ')} ORDER BY q.code`, p);
  let out = rows.map((q) => ({ id: q.id, code: q.code, status: q.status, data: parse(q.data), used: Number(q.used), updated_at: q.updated_at }));
  if (req.query.category) out = out.filter((q) => q.data.category === req.query.category);
  if (req.query.type) out = out.filter((q) => q.data.type === req.query.type);
  return { questions: out };
}));
adminRouter.post('/questions', requireCap('content'), h(async (req) => {
  const code = str(req.body, 'code', 60, true)!;
  if (!CODE.test(code)) throw new ApiError('Code: lowercase letters, numbers and underscores, starting with a letter.', 'validation', 422, { field: 'code' });
  if (await db.val('SELECT id FROM questions WHERE code = ?', [code])) throw new ApiError('This code is already in use.', 'conflict', 409, { field: 'code' });
  const q = checkQuestion({ ...obj(req.body?.data, 'data'), code });
  await categoryExists(q.category);
  const { code: _c, ...data } = q;
  const status = req.body?.status === 'draft' ? 'draft' : 'published';
  const qid = await db.insert('questions', { code, status, data: json(data) });
  await audit(uid(req), 'question.create', 'question', qid, { code });
  return { id: qid };
}));
adminRouter.put('/questions/:id', requireCap('content'), h(async (req) => {
  const cur = await db.one('SELECT * FROM questions WHERE id = ?', [id(req)]);
  if (!cur) throw new ApiError('Not found', 'not_found', 404);
  const q = checkQuestion({ ...obj(req.body?.data, 'data'), code: cur.code });
  await categoryExists(q.category);
  const { code: _c, ...data } = q;
  const status = ['published', 'draft', 'archived'].includes(req.body?.status) ? req.body.status : cur.status;
  await db.update('questions', { data: json(data), status }, 'id = ?', [cur.id]);
  await audit(uid(req), 'question.update', 'question', cur.id, { code: cur.code });
  return { ok: true, note: 'Changes apply to assessments after the template is published again. Completed results are not affected.' };
}));
adminRouter.delete('/questions/:id', requireCap('delete'), h(async (req) => {
  const cur = await db.one('SELECT * FROM questions WHERE id = ?', [id(req)]);
  if (!cur) throw new ApiError('Not found', 'not_found', 404);
  if (Number(await db.val('SELECT COUNT(*) FROM template_questions WHERE question_id = ?', [cur.id]))) {
    await db.update('questions', { status: 'archived' }, 'id = ?', [cur.id]);
    await db.run('DELETE FROM template_questions WHERE question_id = ?', [cur.id]);
    await audit(uid(req), 'question.archive', 'question', cur.id, { code: cur.code });
    return { ok: true, archived: true };
  }
  await db.run('DELETE FROM questions WHERE id = ?', [cur.id]);
  await audit(uid(req), 'question.delete', 'question', cur.id, { code: cur.code });
  return { ok: true, archived: false };
}));

/* ------------------------------ Categories ------------------------------ */
function checkCategory(d: any): Omit<Category, 'key'> {
  obj(d, 'data');
  if (!d.name?.en) throw new ApiError('An English name is required.', 'validation', 422);
  const w = d.weight === undefined ? 1 : Number(d.weight);
  if (!(w >= 0 && w <= 10)) throw new ApiError('Weight must be between 0 and 10.', 'validation', 422);
  return { name: d.name, description: d.description, weight: w, sort: int(d.sort), scored: d.scored !== false };
}
adminRouter.get('/categories', requireCap('view'), h(async () => {
  const rows = await db.all('SELECT * FROM categories');
  const qs = await db.all("SELECT data FROM questions WHERE status <> 'archived'");
  const count: Record<string, number> = {};
  for (const q of qs) { const c = JSON.parse(q.data).category; count[c] = (count[c] ?? 0) + 1; }
  return { categories: rows.map((c) => ({ id: c.id, key: c.key, data: parse(c.data), questions: count[c.key] ?? 0 })).sort((a, b) => (a.data.sort ?? 0) - (b.data.sort ?? 0)) };
}));
adminRouter.post('/categories', requireCap('content'), h(async (req) => {
  const key = str(req.body, 'key', 60, true)!;
  if (!CODE.test(key)) throw new ApiError('Invalid key', 'validation', 422, { field: 'key' });
  if (await db.val('SELECT id FROM categories WHERE `key` = ?', [key])) throw new ApiError('This key is already in use.', 'conflict', 409);
  const cid = await db.insert('categories', { key, data: json(checkCategory(req.body?.data)) });
  await audit(uid(req), 'category.create', 'category', cid, { key });
  return { id: cid };
}));
adminRouter.put('/categories/:id', requireCap('content'), h(async (req) => {
  const c = await db.one('SELECT * FROM categories WHERE id = ?', [id(req)]);
  if (!c) throw new ApiError('Not found', 'not_found', 404);
  await db.update('categories', { data: json(checkCategory(req.body?.data)) }, 'id = ?', [c.id]);
  await audit(uid(req), 'category.update', 'category', c.id);
  return { ok: true };
}));
adminRouter.delete('/categories/:id', requireCap('delete'), h(async (req) => {
  const c = await db.one('SELECT * FROM categories WHERE id = ?', [id(req)]);
  if (!c) throw new ApiError('Not found', 'not_found', 404);
  const used = (await db.all("SELECT data FROM questions WHERE status <> 'archived'")).some((q) => JSON.parse(q.data).category === c.key);
  if (used) throw new ApiError('Move or archive the questions in this category first.', 'conflict', 409);
  await db.run('DELETE FROM categories WHERE id = ?', [c.id]);
  await audit(uid(req), 'category.delete', 'category', c.id, { key: c.key });
  return { ok: true };
}));

/* ------------------------------ Scoring ------------------------------ */
adminRouter.get('/scoring', requireCap('view'), h(async () => ({
  thresholds: await Settings.get('thresholds'), unsure_policy: await Settings.get('unsure_policy'),
  strength_threshold: await Settings.get('strength_threshold'), max_recommendations: await Settings.get('max_recommendations'),
})));
adminRouter.put('/scoring', requireCap('settings'), h(async (req) => {
  const b = obj(req.body, 'body');
  if (b.thresholds !== undefined) {
    const th = (Array.isArray(b.thresholds) ? b.thresholds : []).map((t: any) => ({ min: Number(t?.min), key: String(t?.key ?? '').slice(0, 40), label: { en: String(t?.label?.en ?? '').slice(0, 60), nl: String(t?.label?.nl ?? '').slice(0, 60) } }));
    const e = validateThresholds(th);
    if (e.length) throw new ApiError(e[0], 'validation', 422, { errors: e });
    await Settings.set('thresholds', th);
  }
  if (b.unsure_policy !== undefined) { if (!['zero', 'exclude'].includes(b.unsure_policy)) throw new ApiError('Invalid unsure policy', 'validation', 422); await Settings.set('unsure_policy', b.unsure_policy); }
  if (b.strength_threshold !== undefined) { const v = Number(b.strength_threshold); if (!(v >= 0 && v <= 100)) throw new ApiError('Strength threshold must be 0–100', 'validation', 422); await Settings.set('strength_threshold', v); }
  if (b.max_recommendations !== undefined) { const v = int(b.max_recommendations); if (!(v >= 1 && v <= 30)) throw new ApiError('Max recommendations must be 1–30', 'validation', 422); await Settings.set('max_recommendations', v); }
  await audit(uid(req), 'scoring.update', null, null, { keys: Object.keys(b) });
  return { ok: true, note: 'Scoring changes apply to templates after they are published again.' };
}));

/* -------------------------- Recommendation rules -------------------------- */
const TRIGGERS = ['score_lte', 'answer_in', 'unsure', 'gap', 'category_lt', 'mapped'];
function checkRule(d: any): Omit<Rule, 'code'> {
  obj(d, 'data');
  const e: string[] = [];
  if (!['critical', 'high', 'medium', 'low'].includes(d.priority)) e.push('Invalid priority');
  if (!d.title?.en || !d.description?.en) e.push('English title and description are required');
  if (d.service && !(d.service in SERVICES)) e.push('Unknown service');
  const conds = d.trigger?.conditions;
  if (!Array.isArray(conds) || !conds.length) e.push('At least one trigger condition is required');
  else for (const c of conds) if (!TRIGGERS.includes(c?.type)) e.push(`Unknown trigger type: ${c?.type}`);
  if (d.templates !== undefined && !Array.isArray(d.templates)) e.push('templates must be a list');
  if (e.length) throw new ApiError(e[0], 'validation', 422, { errors: e });
  return d;
}
adminRouter.get('/rules', requireCap('view'), h(async () => ({ rules: (await db.all('SELECT * FROM recommendation_rules ORDER BY code')).map((r) => ({ id: r.id, code: r.code, active: !!r.active, data: parse(r.data), updated_at: r.updated_at })), services: SERVICES })));
adminRouter.post('/rules', requireCap('content'), h(async (req) => {
  const code = str(req.body, 'code', 60, true)!;
  if (!CODE.test(code)) throw new ApiError('Invalid code', 'validation', 422, { field: 'code' });
  if (await db.val('SELECT id FROM recommendation_rules WHERE code = ?', [code])) throw new ApiError('This code is already in use.', 'conflict', 409);
  const rid = await db.insert('recommendation_rules', { code, active: req.body?.active === false ? 0 : 1, data: json(checkRule(req.body?.data)) });
  await audit(uid(req), 'rule.create', 'rule', rid, { code });
  return { id: rid };
}));
adminRouter.put('/rules/:id', requireCap('content'), h(async (req) => {
  const r = await db.one('SELECT * FROM recommendation_rules WHERE id = ?', [id(req)]);
  if (!r) throw new ApiError('Not found', 'not_found', 404);
  const row: any = {};
  if (req.body?.data !== undefined) row.data = json(checkRule(req.body.data));
  if (req.body?.active !== undefined) row.active = bool(req.body.active) ? 1 : 0;
  if (Object.keys(row).length) await db.update('recommendation_rules', row, 'id = ?', [r.id]);
  await audit(uid(req), 'rule.update', 'rule', r.id);
  return { ok: true };
}));
adminRouter.delete('/rules/:id', requireCap('delete'), h(async (req) => {
  const r = await db.one('SELECT * FROM recommendation_rules WHERE id = ?', [id(req)]);
  if (!r) throw new ApiError('Not found', 'not_found', 404);
  await db.run('DELETE FROM recommendation_rules WHERE id = ?', [r.id]);
  await audit(uid(req), 'rule.delete', 'rule', r.id, { code: r.code });
  return { ok: true };
}));

/* ---------------------------- Assessments ---------------------------- */
function assessmentFilter(req: Request): [string, unknown[]] {
  const w = ['1=1']; const p: unknown[] = [];
  const d = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  if (d(req.query.from)) { w.push('a.created_at >= ?'); p.push(`${req.query.from} 00:00:00`); }
  if (d(req.query.to)) { w.push('a.created_at <= ?'); p.push(`${req.query.to} 23:59:59`); }
  if (req.query.template) { w.push('t.slug = ?'); p.push(String(req.query.template)); }
  if (req.query.classification) { w.push('a.classification = ?'); p.push(String(req.query.classification)); }
  if (req.query.industry) { w.push('a.industry = ?'); p.push(String(req.query.industry)); }
  if (req.query.company_size) { w.push('a.company_size = ?'); p.push(String(req.query.company_size)); }
  if (req.query.lead === '1') w.push('l.id IS NOT NULL');
  if (req.query.lead === '0') w.push('l.id IS NULL');
  if (req.query.ref) { w.push('a.public_ref = ?'); p.push(String(req.query.ref)); }
  return [w.join(' AND '), p];
}
const A_SELECT = `SELECT a.id, a.public_ref, a.created_at, a.locale, a.overall_score, a.classification, a.coverage, a.uncertainty, a.industry, a.company_size, a.country, a.gap_codes,
  t.slug template, v.version, l.id lead_id FROM assessments a JOIN templates t ON t.id = a.template_id JOIN template_versions v ON v.id = a.version_id LEFT JOIN leads l ON l.assessment_id = a.id`;

adminRouter.get('/assessments', requireCap('assessments'), h(async (req) => {
  const [w, p] = assessmentFilter(req); const pg = page(req);
  const total = Number(await db.val(`SELECT COUNT(*) FROM assessments a JOIN templates t ON t.id = a.template_id LEFT JOIN leads l ON l.assessment_id = a.id WHERE ${w}`, p));
  const rows = await db.all(`${A_SELECT} WHERE ${w} ORDER BY a.id DESC LIMIT ${pg.size} OFFSET ${pg.offset}`, p);
  return { total, page: pg.page, size: pg.size, assessments: rows.map((r) => ({ ...r, gaps: r.gap_codes ? String(r.gap_codes).split(',').length : 0, gap_codes: undefined })) };
}));
adminRouter.get('/assessments/export.csv', requireCap('export'), h(async (req, res) => {
  const [w, p] = assessmentFilter(req);
  const rows = await db.all(`${A_SELECT} WHERE ${w} ORDER BY a.id DESC LIMIT 20000`, p);
  await audit(uid(req), 'assessments.export', null, null, { rows: rows.length });
  res.set('Content-Type', 'text/csv; charset=utf-8'); res.set('Content-Disposition', `attachment; filename="assessments-${now().slice(0, 10)}.csv"`); res.set('Cache-Control', 'no-store');
  res.send(csv([['ref', 'date', 'template', 'version', 'locale', 'score', 'classification', 'coverage', 'uncertainty', 'industry', 'company_size', 'country', 'critical_gaps', 'has_lead'],
    ...rows.map((r) => [r.public_ref, r.created_at, r.template, r.version, r.locale, r.overall_score, r.classification, r.coverage, r.uncertainty, r.industry, r.company_size, r.country, r.gap_codes ?? '', r.lead_id ? 'yes' : 'no'])]));
}));
adminRouter.get('/assessments/:id', requireCap('assessments'), h(async (req) => {
  const a = await db.one('SELECT * FROM assessments WHERE id = ?', [id(req)]);
  if (!a) throw new ApiError('Not found', 'not_found', 404);
  const snap = await Templates.snapshotByVersion(a.version_id);
  const v = await Templates.versionRow(a.version_id);
  const lead = await db.one('SELECT id, public_ref, status FROM leads WHERE assessment_id = ?', [a.id]);
  const tokens = await db.all('SELECT id, expires_at, revoked_at, download_count, last_download_at, created_at FROM report_tokens WHERE assessment_id = ? ORDER BY id DESC', [a.id]);
  await audit(uid(req), 'assessment.view', 'assessment', a.id);
  return {
    assessment: { id: a.id, ref: a.public_ref, created_at: a.created_at, locale: a.locale, result_expires_at: a.result_expires_at, template: snap.template.slug, version: v?.version, version_id: a.version_id },
    answers: Crypto.decryptJson(a.answers_enc), result: Crypto.decryptJson(a.result_enc),
    questions: snap.questions.map((q) => ({ code: q.code, category: q.category, type: q.type, title: q.title, options: q.options ?? null })),
    lead, report_links: tokens,
  };
}));
adminRouter.post('/assessments/:id/recompute', requireCap('assessments'), h(async (req) => {
  const a = await db.one('SELECT result_enc FROM assessments WHERE id = ?', [id(req)]);
  if (!a) throw new ApiError('Not found', 'not_found', 404);
  const fresh = await Assessments.recompute(id(req));
  const stored = Crypto.decryptJson(a.result_enc);
  return { reproducible: JSON.stringify(fresh) === JSON.stringify(stored), result: fresh };
}));
adminRouter.delete('/assessments/:id', requireCap('delete'), h(async (req) => {
  const aid = id(req);
  const lead = await db.val<number>('SELECT id FROM leads WHERE assessment_id = ?', [aid]);
  if (lead) await Leads.erase(lead);
  else { await db.run('DELETE FROM report_tokens WHERE assessment_id = ?', [aid]); await db.run('DELETE FROM assessments WHERE id = ?', [aid]); }
  await audit(uid(req), 'assessment.delete', 'assessment', aid, { with_lead: !!lead });
  return { ok: true };
}));
adminRouter.get('/assessments/:id/report.pdf', requireCap('reports'), h(async (req, res) => {
  const a = await db.one('SELECT * FROM assessments WHERE id = ?', [id(req)]);
  if (!a) throw new ApiError('Not found', 'not_found', 404);
  const lead = await db.one('SELECT * FROM leads WHERE assessment_id = ?', [a.id]);
  const l = (req.query.locale === 'nl' || req.query.locale === 'en' ? req.query.locale : a.locale) as Loc;
  const pdf = await buildReport(a, lead ? Leads.decrypt(lead) : null, l);
  await audit(uid(req), 'report.download_admin', 'assessment', a.id);
  res.set('Content-Type', 'application/pdf'); res.set('Cache-Control', 'no-store');
  res.set('Content-Disposition', `attachment; filename="BlazeKonzult-readiness-report-${a.public_ref}.pdf"`);
  res.end(pdf);
}));
/** New secure download link (e.g. after expiry). The raw token is only returned once. */
adminRouter.post('/assessments/:id/report-link', requireCap('reports'), h(async (req) => {
  const a = await db.one('SELECT id FROM assessments WHERE id = ?', [id(req)]);
  if (!a) throw new ApiError('Not found', 'not_found', 404);
  const lead = await db.val<number>('SELECT id FROM leads WHERE assessment_id = ?', [a.id]);
  const days = Math.min(90, Math.max(1, int(req.body?.days, await Settings.get('report_link_days'))));
  const [tok, hash] = Token.generate();
  const expires = now(86400 * days);
  const rid = await db.insert('report_tokens', { assessment_id: a.id, lead_id: lead, token_hash: hash, expires_at: expires, created_by: uid(req) });
  await audit(uid(req), 'report.link_created', 'report', rid, { assessment: a.id, days });
  return { id: rid, url: reportUrl(tok), expires_at: expires };
}));

/* ------------------------------- Reports ------------------------------- */
adminRouter.get('/reports', requireCap('reports'), h(async (req) => {
  const pg = page(req);
  const total = Number(await db.val('SELECT COUNT(*) FROM report_tokens'));
  const rows = await db.all(`SELECT r.id, r.assessment_id, r.lead_id, r.expires_at, r.revoked_at, r.download_count, r.last_download_at, r.created_at, r.created_by,
      a.public_ref assessment_ref, l.public_ref lead_ref, l.company_enc FROM report_tokens r JOIN assessments a ON a.id = r.assessment_id LEFT JOIN leads l ON l.id = r.lead_id
    ORDER BY r.id DESC LIMIT ${pg.size} OFFSET ${pg.offset}`);
  const t = Date.now();
  return { total, page: pg.page, size: pg.size, reports: rows.map(({ company_enc, ...r }) => ({ ...r, company: Crypto.decrypt(company_enc),
    state: r.revoked_at ? 'revoked' : new Date(r.expires_at + 'Z').getTime() < t ? 'expired' : 'active' })) };
}));
adminRouter.post('/reports/:id/revoke', requireCap('reports'), h(async (req) => {
  const n = await db.update('report_tokens', { revoked_at: now() }, 'id = ? AND revoked_at IS NULL', [id(req)]);
  await audit(uid(req), 'report.revoke', 'report', id(req));
  return { ok: true, changed: n > 0 };
}));

/* -------------------------------- Leads -------------------------------- */
async function leadRows(req: Request, limit = 5000) {
  const w = ['1=1']; const p: unknown[] = [];
  if (req.query.status) { w.push('l.status = ?'); p.push(String(req.query.status)); }
  if (req.query.priority) { w.push('l.priority = ?'); p.push(String(req.query.priority)); }
  if (req.query.source) { w.push('l.source = ?'); p.push(String(req.query.source)); }
  if (req.query.assigned) { w.push(req.query.assigned === 'none' ? 'l.assigned_to IS NULL' : 'l.assigned_to = ?'); if (req.query.assigned !== 'none') p.push(int(req.query.assigned)); }
  if (req.query.consultation === '1') w.push('l.wants_consultation = 1');
  if (req.query.due === '1') { w.push("l.next_follow_up_at IS NOT NULL AND l.next_follow_up_at <= ? AND l.status NOT IN ('converted','closed')"); p.push(now()); }
  if (req.query.followup === '1') w.push("l.next_follow_up_at IS NOT NULL AND l.status NOT IN ('converted','closed')");
  if (req.query.from && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.from))) { w.push('l.created_at >= ?'); p.push(`${req.query.from} 00:00:00`); }
  if (req.query.to && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.to))) { w.push('l.created_at <= ?'); p.push(`${req.query.to} 23:59:59`); }
  const SORTS: Record<string, string> = { created: 'l.id', updated: 'l.updated_at', status: "FIELD(l.status,'new','contacted','qualified','consultation_scheduled','proposal_sent','converted','closed')", priority: "FIELD(l.priority,'high','medium','low')", follow_up: 'COALESCE(l.next_follow_up_at, \'9999-12-31\')', contacted: "COALESCE(l.last_contacted_at, '0000-01-01')", score: 'COALESCE(a.overall_score, -1)' };
  const sortKey = SORTS[String(req.query.sort ?? '')] ? String(req.query.sort) : 'created';
  const dir = req.query.dir === 'asc' ? 'ASC' : req.query.dir === 'desc' ? 'DESC' : (['priority', 'status', 'follow_up'].includes(sortKey) ? 'ASC' : 'DESC');
  const rows = await db.all(`SELECT l.*, a.overall_score, a.classification, t.slug template, u.name assigned_name FROM leads l LEFT JOIN assessments a ON a.id = l.assessment_id LEFT JOIN templates t ON t.id = a.template_id LEFT JOIN users u ON u.id = l.assigned_to
    WHERE ${w.join(' AND ')} ORDER BY ${SORTS[sortKey]} ${dir}, l.id DESC LIMIT ${limit}`, p);
  let out = rows.map((r) => ({ ...Leads.decrypt(r), overall_score: r.overall_score, classification: r.classification, template: r.template, assigned_name: r.assigned_name as string | null }));
  if (req.query.sort === 'company') out.sort((a, b) => (a.company ?? '').localeCompare(b.company ?? '') * (req.query.dir === 'desc' ? -1 : 1));
  if (req.query.sort === 'name') out.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') * (req.query.dir === 'desc' ? -1 : 1));
  const q = String(req.query.q ?? '').trim().toLowerCase().slice(0, 100);
  if (q) out = out.filter((l) => [l.name, l.company, l.email, l.ref].some((v) => (v ?? '').toLowerCase().includes(q)));
  return out;
}
adminRouter.get('/leads', requireCap('leads'), h(async (req) => {
  const all = await leadRows(req); const pg = page(req);
  const users = await db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name');
  return { total: all.length, page: pg.page, size: pg.size, statuses: STATUSES, users,
    leads: all.slice(pg.offset, pg.offset + pg.size).map((l) => ({ id: l.id, ref: l.ref, name: l.name, company: l.company, email: l.email, source: l.source, status: l.status, priority: l.priority, priority_score: l.priority_score, wants_consultation: l.wants_consultation, wants_report: l.wants_report, assigned_to: l.assigned_to, assigned_name: l.assigned_name, overall_score: l.overall_score, classification: l.classification, template: l.template, created_at: l.created_at, updated_at: l.updated_at, next_follow_up_at: l.next_follow_up_at, last_contacted_at: l.last_contacted_at, industry: l.details.industry ?? l.details.sector ?? null, interests: l.details.interests ?? [], company_size: l.details.company_size ?? null })) };
}));
adminRouter.get('/leads/export.csv', requireCap('export'), h(async (req, res) => {
  const rows = await leadRows(req, 20000);
  await audit(uid(req), 'leads.export', null, null, { rows: rows.length });
  res.set('Content-Type', 'text/csv; charset=utf-8'); res.set('Content-Disposition', `attachment; filename="leads-${now().slice(0, 10)}.csv"`); res.set('Cache-Control', 'no-store');
  res.send(csv([['ref', 'created', 'source', 'status', 'priority', 'name', 'company', 'email', 'phone', 'job_title', 'contact_method', 'timeframe', 'company_size', 'wants_consultation', 'wants_report', 'marketing_consent', 'template', 'score', 'classification'],
    ...rows.map((l) => [l.ref, l.created_at, l.source, l.status, l.priority, l.name, l.company, l.email, l.phone, l.job_title, l.details.contact_method, l.details.timeframe, l.details.company_size, l.wants_consultation ? 'yes' : 'no', l.wants_report ? 'yes' : 'no', l.consent_marketing ? 'yes' : 'no', l.template, l.overall_score, l.classification])]));
}));
adminRouter.get('/leads/:id', requireCap('leads'), h(async (req) => {
  const l = await db.one('SELECT * FROM leads WHERE id = ?', [id(req)]);
  if (!l) throw new ApiError('Not found', 'not_found', 404);
  const notes = (await db.all('SELECT n.id, n.created_at, n.note_enc, u.name author FROM lead_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.lead_id = ? ORDER BY n.id DESC', [l.id]))
    .map((n) => ({ id: n.id, created_at: n.created_at, author: n.author, note: Crypto.decrypt(n.note_enc) }));
  let assessment = null;
  if (l.assessment_id) {
    const a = await db.one(`SELECT a.id, a.public_ref, a.created_at, a.overall_score, a.classification, a.coverage, a.uncertainty, a.gap_codes, t.slug template, a.result_enc
      FROM assessments a JOIN templates t ON t.id = a.template_id WHERE a.id = ?`, [l.assessment_id]);
    if (a) { const r: any = Crypto.decryptJson(a.result_enc); const { result_enc: _r, ...rest } = a; assessment = { ...rest, gaps: r?.gaps ?? [], categories: r?.categories ?? [], services: r?.services ?? [] }; }
  }
  const emails = await db.all('SELECT id, kind, status, attempts, created_at, sent_at, last_error FROM email_outbox WHERE lead_id = ? ORDER BY id DESC', [l.id]);
  await audit(uid(req), 'lead.view', 'lead', l.id);
  return { lead: Leads.decrypt(l), notes, assessment, emails, statuses: STATUSES, users: await db.all('SELECT id, name FROM users WHERE active = 1 ORDER BY name') };
}));
adminRouter.patch('/leads/:id', requireCap('leads'), h(async (req) => {
  const l = await db.one('SELECT id, status, priority, assigned_to, last_contacted_at FROM leads WHERE id = ?', [id(req)]);
  if (!l) throw new ApiError('Not found', 'not_found', 404);
  const row: any = {};
  if (req.body?.status !== undefined) { if (!STATUSES.includes(req.body.status)) throw new ApiError('Invalid status', 'validation', 422); row.status = req.body.status; if (row.status === 'contacted' && !l.last_contacted_at) row.last_contacted_at = now(); }
  const dateOrNull = (v: unknown, field: string) => { if (v === null || v === '') return null; const sv = String(v); if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/.test(sv) || isNaN(new Date(sv.replace(' ', 'T') + 'Z').getTime())) throw new ApiError('Invalid date', 'validation', 422, { field }); return sv.length === 10 ? `${sv} 09:00:00` : sv.length === 16 ? `${sv}:00` : sv; };
  if (req.body?.next_follow_up_at !== undefined) row.next_follow_up_at = dateOrNull(req.body.next_follow_up_at, 'next_follow_up_at');
  if (req.body?.last_contacted_at !== undefined) row.last_contacted_at = req.body.last_contacted_at === 'now' ? now() : dateOrNull(req.body.last_contacted_at, 'last_contacted_at');
  if (req.body?.priority !== undefined) { if (!['high', 'medium', 'low'].includes(req.body.priority)) throw new ApiError('Invalid priority', 'validation', 422); row.priority = req.body.priority; }
  if (req.body?.assigned_to !== undefined) {
    const a = req.body.assigned_to === null || req.body.assigned_to === '' ? null : int(req.body.assigned_to);
    if (a !== null && !(await db.val('SELECT id FROM users WHERE id = ? AND active = 1', [a]))) throw new ApiError('Unknown user', 'validation', 422);
    row.assigned_to = a;
  }
  if (!Object.keys(row).length) return { ok: true };
  await db.update('leads', row, 'id = ?', [l.id]);
  await audit(uid(req), 'lead.update', 'lead', l.id, { from: { status: l.status, priority: l.priority, assigned_to: l.assigned_to }, to: row });
  return { ok: true, lead: Leads.decrypt(await db.one('SELECT * FROM leads WHERE id = ?', [l.id])) };
}));
adminRouter.post('/leads/:id/notes', requireCap('leads'), h(async (req) => {
  const l = await db.val('SELECT id FROM leads WHERE id = ?', [id(req)]);
  if (!l) throw new ApiError('Not found', 'not_found', 404);
  const note = str(req.body, 'note', 5000, true)!;
  const nid = await db.insert('lead_notes', { lead_id: id(req), user_id: uid(req), note_enc: Crypto.encrypt(note) });
  await audit(uid(req), 'lead.note', 'lead', id(req));
  return { id: nid };
}));
adminRouter.get('/leads/:id/export', requireCap('export'), h(async (req, res) => {
  const data = await Leads.export(id(req));
  await audit(uid(req), 'lead.export', 'lead', id(req));
  res.set('Content-Disposition', `attachment; filename="lead-${data.lead.ref}.json"`); res.set('Cache-Control', 'no-store');
  return data;
}));
adminRouter.delete('/leads/:id', requireCap('delete'), h(async (req) => {
  await Leads.erase(id(req));
  await audit(uid(req), 'lead.erase', 'lead', id(req));
  return { ok: true };
}));
/** Data-subject request: find all leads for an email address (blind index lookup). */
adminRouter.post('/privacy/lookup', requireCap('export'), h(async (req) => {
  const e = oneLine(str(req.body, 'email', 190, true))!.toLowerCase();
  if (!isEmail(e)) throw new ApiError('Invalid email', 'validation', 422);
  const rows = await db.all('SELECT id, public_ref, source, created_at FROM leads WHERE email_hash = ?', [Crypto.blindIndex(e)]);
  await audit(uid(req), 'privacy.lookup', null, null, { found: rows.length });
  return { leads: rows };
}));

/* ------------------------------ Analytics ------------------------------ */
adminRouter.get('/analytics', requireCap('view'), h(async (req) => analytics({
  from: req.query.from as string, to: req.query.to as string, template: req.query.template as string, industry: req.query.industry as string, company_size: req.query.company_size as string,
})));

/* ------------------------------ Settings ------------------------------ */
const EDITABLE: SettingKey[] = ['notify_emails', 'notify_on_new_lead', 'notify_on_consultation', 'notify_high_priority_only', 'participant_emails', 'report_link_days', 'result_link_days',
  'retention_days_anonymous', 'retention_days_leads', 'retention_days_sessions', 'retention_days_audit', 'track_steps', 'min_completion_seconds', 'lead_scoring', 'company'];
adminRouter.get('/settings', requireCap('settings'), h(async () => {
  const all = await Settings.all();
  return { settings: Object.fromEntries(EDITABLE.map((k) => [k, all[k]])) };
}));
adminRouter.put('/settings', requireCap('settings'), h(async (req) => {
  const b = obj(req.body?.settings, 'settings');
  const changed: string[] = [];
  for (const [k, v] of Object.entries(b)) {
    if (!EDITABLE.includes(k as SettingKey)) throw new ApiError(`Unknown setting: ${k}`, 'validation', 422);
    const def = (DEFAULTS as any)[k];
    let val: any = v;
    if (typeof def === 'boolean') val = bool(v);
    else if (typeof def === 'number') {
      val = int(v);
      const [min, max] = k.startsWith('retention') ? [7, 3650] : k.endsWith('link_days') ? [1, 365] : [0, 600];
      if (!(val >= min && val <= max)) throw new ApiError(`${k} must be between ${min} and ${max}`, 'validation', 422, { field: k });
    } else if (k === 'notify_emails') {
      val = (Array.isArray(v) ? v : String(v).split(/[\s,;]+/)).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
      if (val.length > 10 || val.some((x: string) => !isEmail(x))) throw new ApiError('Enter up to 10 valid email addresses.', 'validation', 422, { field: k });
    } else if (k === 'lead_scoring') {
      obj(v, k);
      for (const n of ['consultation', 'report_only', 'per_interest', 'max_interest', 'high', 'medium']) if (typeof (v as any)[n] !== 'number') throw new ApiError(`lead_scoring.${n} must be a number`, 'validation', 422);
      val = { ...def, ...(v as any) };
    } else if (k === 'company') {
      obj(v, k); val = Object.fromEntries(Object.entries({ ...def, ...(v as any) }).map(([a, b2]) => [a, String(b2).slice(0, 200)]));
    }
    await Settings.set(k as SettingKey, val);
    changed.push(k);
  }
  await audit(uid(req), 'settings.update', null, null, { keys: changed });
  return { ok: true };
}));
adminRouter.post('/retention/run', requireCap('settings'), h(async (req) => runRetention(uid(req))));
adminRouter.get('/emails', requireCap('settings'), h(async (req) => {
  const pg = page(req);
  const rows = await db.all(`SELECT id, kind, status, attempts, next_attempt_at, last_error, created_at, sent_at, lead_id FROM email_outbox ORDER BY id DESC LIMIT ${pg.size} OFFSET ${pg.offset}`);
  return { emails: rows, total: Number(await db.val('SELECT COUNT(*) FROM email_outbox')) };
}));
adminRouter.post('/emails/process', requireCap('settings'), h(async () => Mailer.processQueue(50)));
adminRouter.post('/emails/:id/retry', requireCap('settings'), h(async (req) => {
  await db.update('email_outbox', { status: 'queued', attempts: 0, next_attempt_at: now() }, "id = ? AND status = 'failed'", [id(req)]);
  return { sent: await Mailer.attempt(id(req)) };
}));
adminRouter.post('/emails/test', requireCap('settings'), h(async (req) => {
  const to = oneLine(str(req.body, 'to', 190, true))!;
  if (!isEmail(to)) throw new ApiError('Invalid email', 'validation', 422);
  const { renderEmail } = await import('../mailer');
  const [html, text] = renderEmail('en', 'Test email', ['This is a test email from the BlazeKonzult assessment platform.'], null, [], false);
  const mid = await Mailer.queue('test', to, 'BlazeKonzult test email', html, text);
  return { sent: (await db.val('SELECT status FROM email_outbox WHERE id = ?', [mid])) === 'sent' };
}));

/* -------------------------------- Users -------------------------------- */
adminRouter.get('/users', requireCap('users'), h(async () => ({ users: await db.all('SELECT u.id, u.email, u.name, u.role, u.active, u.last_login_at, u.locked_until, u.created_at, (SELECT COUNT(*) FROM admin_sessions s WHERE s.user_id = u.id AND s.expires_at > UTC_TIMESTAMP()) sessions, m.enabled_at mfa_enabled_at FROM users u LEFT JOIN user_mfa m ON m.user_id = u.id ORDER BY u.id'), roles: ROLES })));
adminRouter.post('/users', requireCap('users'), h(async (req) => {
  const email = oneLine(str(req.body, 'email', 190, true))!.toLowerCase();
  if (!isEmail(email)) throw new ApiError('Invalid email', 'validation', 422, { field: 'email' });
  const name = oneLine(str(req.body, 'name', 120, true))!;
  const role = req.body?.role as Role;
  if (!ROLES.includes(role)) throw new ApiError('Invalid role', 'validation', 422, { field: 'role' });
  const pw = str(req.body, 'password', 200, true)!; Password.validate(pw);
  if (await db.val('SELECT id FROM users WHERE email = ?', [email])) throw new ApiError('A user with this email already exists.', 'conflict', 409);
  const nid = await db.insert('users', { email, name, role, password_hash: Password.hash(pw) });
  await audit(uid(req), 'user.create', 'user', nid, { role });
  return { id: nid };
}));
adminRouter.put('/users/:id', requireCap('users'), h(async (req) => {
  const u = await db.one('SELECT id, role, active FROM users WHERE id = ?', [id(req)]);
  if (!u) throw new ApiError('Not found', 'not_found', 404);
  const row: any = {};
  if (req.body?.name !== undefined) row.name = oneLine(str(req.body, 'name', 120, true));
  if (req.body?.role !== undefined) { if (!ROLES.includes(req.body.role)) throw new ApiError('Invalid role', 'validation', 422); row.role = req.body.role; }
  if (req.body?.active !== undefined) row.active = bool(req.body.active) ? 1 : 0;
  if (req.body?.password) { const pw = str(req.body, 'password', 200, true)!; Password.validate(pw); row.password_hash = Password.hash(pw); row.failed_logins = 0; row.locked_until = null; }
  if (req.body?.reset_2fa) await Auth.resetMfa(u.id, uid(req));
  const demoting = u.role === 'owner' && ((row.role && row.role !== 'owner') || row.active === 0);
  if (demoting && Number(await db.val("SELECT COUNT(*) FROM users WHERE role = 'owner' AND active = 1")) <= 1) throw new ApiError('At least one active owner is required.', 'conflict', 409);
  if (Object.keys(row).length) await db.update('users', row, 'id = ?', [u.id]);
  if (row.active === 0 || row.password_hash || row.role) await db.run('DELETE FROM admin_sessions WHERE user_id = ? AND user_id <> ?', [u.id, uid(req)]);
  await audit(uid(req), 'user.update', 'user', u.id, { fields: Object.keys(row).filter((k) => k !== 'password_hash') });
  return { ok: true };
}));

/* -------------------------------- Audit -------------------------------- */
adminRouter.get('/audit', requireCap('audit'), h(async (req) => {
  const pg = page(req);
  const w = ['1=1']; const p: unknown[] = [];
  if (req.query.action) { w.push('a.action LIKE ?'); p.push(`${String(req.query.action).slice(0, 60)}%`); }
  if (req.query.user) { w.push('a.user_id = ?'); p.push(int(req.query.user)); }
  const rows = await db.all(`SELECT a.*, u.name user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id WHERE ${w.join(' AND ')} ORDER BY a.id DESC LIMIT ${pg.size} OFFSET ${pg.offset}`, p);
  return { entries: rows.map((r) => ({ ...r, meta: parse(r.meta) })), total: Number(await db.val(`SELECT COUNT(*) FROM audit_log a WHERE ${w.join(' AND ')}`, p)) };
}));

/* ---------------------------- Website content ---------------------------- */
adminRouter.get('/content', requireCap('view'), h(async () => ({ docs: await Content.list() })));
adminRouter.get('/content/:key', requireCap('view'), h(async (req) => ({ doc: await Content.get(String(req.params.key)) })));
adminRouter.put('/content/:key', requireCap('content'), h(async (req) => {
  const key = checkKey(String(req.params.key));
  await Content.save(key, req.body?.data, uid(req));
  await audit(uid(req), 'content.save', 'content', key);
  return { ok: true };
}));
adminRouter.delete('/content/:key', requireCap('content'), h(async (req) => {
  const key = checkKey(String(req.params.key));
  await Content.reset(key, uid(req));
  await audit(uid(req), 'content.reset', 'content', key);
  return { ok: true };
}));
adminRouter.get('/content/:key/revisions', requireCap('view'), h(async (req) => ({ revisions: await Content.revisions(String(req.params.key)) })));
adminRouter.get('/revisions/:id', requireCap('view'), h(async (req) => ({ revision: await Content.revision(id(req)) })));
adminRouter.post('/revisions/:id/restore', requireCap('content'), h(async (req) => {
  const key = await Content.restore(id(req), uid(req));
  await audit(uid(req), 'content.restore', 'content', key, { revision: id(req) });
  return { ok: true, key };
}));

/* --------------------------------- Media --------------------------------- */
adminRouter.get('/media', requireCap('view'), h(async () => ({ media: await Media.list() })));
adminRouter.post('/media', requireCap('content'), express.raw({ type: () => true, limit: MAX_BYTES + 1024 }), h(async (req) => {
  const name = decodeURIComponent(String(req.get('x-filename') ?? 'image')).slice(0, 190);
  const alt = req.get('x-alt') ? decodeURIComponent(String(req.get('x-alt'))) : null;
  const m = await Media.upload(req.body as Buffer, name, alt, uid(req));
  await audit(uid(req), 'media.upload', 'media', m.id, { name });
  return m;
}));
adminRouter.patch('/media/:id', requireCap('content'), h(async (req) => {
  await db.update('media', { alt: String(req.body?.alt ?? '').slice(0, 300) }, 'id = ?', [id(req)]);
  return { ok: true };
}));
adminRouter.delete('/media/:id', requireCap('delete'), h(async (req) => {
  const r = await Media.remove(id(req), req.query.force === '1');
  await audit(uid(req), 'media.delete', 'media', id(req), r);
  return { ok: true };
}));
