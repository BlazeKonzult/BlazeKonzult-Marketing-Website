import type { Request } from 'express';
import { db, now } from './db';
import { ApiError, int, locale, str } from './http';
import { botCheck, Crypto, RateLimit, Token } from './security';
import { Settings } from './settings';
import { Templates } from './templates';
import { evaluate, validate, Result } from './engine';

export const Assessments = {
  /** Submit answers. Idempotent: the same client submission key returns the same result token. */
  async submit(req: Request, body: any) {
    botCheck(body, await Settings.get('min_completion_seconds'));
    await RateLimit.hit(req, 'submit', 15, 3600);
    const idem = String(body?.idempotency_key ?? '').toLowerCase();
    if (!Token.uuidValid(idem)) throw new ApiError('Invalid submission key', 'validation', 422);
    const slug = str(body, 'slug', 80, true)!;
    const l = locale(body?.locale);
    const t = await Templates.bySlug(slug);
    if (!t) throw new ApiError('Assessment not found', 'not_found', 404);
    const versionId = int(body?.version_id);
    const ver = await Templates.versionRow(versionId);
    if (!ver || ver.template_id !== t.id) throw new ApiError('This version of the assessment is no longer available. Please restart.', 'stale_version', 409);
    if (t.status !== 'published') throw new ApiError('This assessment is not currently available.', 'unavailable', 410);

    const token = Token.resultToken(idem);
    if (await db.one('SELECT id FROM assessments WHERE idempotency_key = ?', [idem])) return { token, duplicate: true, ...(await Assessments.resultByToken(token)) };

    const answers = body?.answers && typeof body.answers === 'object' && !Array.isArray(body.answers) ? body.answers : {};
    if (Object.keys(answers).length > 300) throw new ApiError('Too many answers', 'validation', 422);
    const snap = await Templates.snapshotByVersion(versionId);
    const [clean, errors] = validate(snap, answers);
    if (Object.keys(errors).length) throw new ApiError('Please answer all required questions.', 'validation', 422, { questions: errors });
    const result = evaluate(snap, clean);
    const p = result.profile;
    const sessionId = typeof body?.session_id === 'string' && /^[a-f0-9]{32}$/.test(body.session_id)
      ? await db.val<number>('SELECT id FROM assessment_sessions WHERE public_id = ?', [body.session_id]) : null;

    try {
      await db.insert('assessments', {
        public_ref: Token.ref(), token_hash: Token.hash(token), idempotency_key: idem, session_id: sessionId,
        template_id: t.id, version_id: versionId, locale: l,
        answers_enc: Crypto.encryptJson(clean), result_enc: Crypto.encryptJson(result),
        overall_score: result.overall, classification: result.classification?.key ?? null, coverage: result.coverage, uncertainty: result.uncertainty,
        category_scores: JSON.stringify(Object.fromEntries(result.categories.map((c) => [c.key, c.score]))),
        gap_codes: result.gaps.map((g) => g.code).join(',') || null,
        industry: typeof p.industry === 'string' ? p.industry.slice(0, 60) : null,
        company_size: typeof p.company_size === 'string' ? p.company_size.slice(0, 20) : null,
        country: typeof p.country === 'string' ? p.country.slice(0, 20) : null,
        result_expires_at: now(86400 * (await Settings.get('result_link_days'))),
      });
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY') return { token, duplicate: true, ...(await Assessments.resultByToken(token)) }; // concurrent duplicate
      throw e;
    }
    if (sessionId) await db.run('UPDATE assessment_sessions SET completed_at = ? WHERE id = ? AND completed_at IS NULL', [now(), sessionId]);
    return { token, duplicate: false, ...(await Assessments.resultByToken(token)) };
  },

  async rowByToken(token: string) {
    if (!Token.valid(token)) throw new ApiError('Result not found or expired', 'not_found', 404);
    const a = await db.one('SELECT * FROM assessments WHERE token_hash = ?', [Token.hash(token)]);
    if (!a || new Date(a.result_expires_at + 'Z').getTime() < Date.now()) throw new ApiError('Result not found or expired', 'not_found', 404);
    return a;
  },

  async resultByToken(token: string) { return Assessments.publicResult(await Assessments.rowByToken(token)); },

  async publicResult(a: any) {
    const v = await Templates.versionRow(a.version_id);
    const snap = await Templates.snapshotByVersion(a.version_id);
    const result = Crypto.decryptJson<Result>(a.result_enc)!;
    const { visible: _v, ...rest } = result;
    return {
      ref: a.public_ref, created_at: a.created_at, locale: a.locale,
      template: { slug: snap.template.slug, name: snap.template.name, version: v?.version ?? null },
      thresholds: snap.template.thresholds,
      has_lead: Number(await db.val('SELECT COUNT(*) FROM leads WHERE assessment_id = ?', [a.id])) > 0,
      result: rest,
    };
  },

  /** Recompute from stored answers + stored snapshot (reproducibility check). */
  async recompute(id: number): Promise<Result> {
    const a = await db.one('SELECT * FROM assessments WHERE id = ?', [id]);
    if (!a) throw new ApiError('Not found', 'not_found', 404);
    return evaluate(await Templates.snapshotByVersion(a.version_id), Crypto.decryptJson(a.answers_enc) ?? {});
  },
};

/** Anonymous funnel tracking (no answers, no personal data). */
export const Sessions = {
  async start(req: Request, body: any) {
    await RateLimit.hit(req, 'session', 60, 3600);
    const t = await Templates.bySlug(String(body?.slug ?? ''));
    if (!t || !t.current_version_id || t.status !== 'published') throw new ApiError('Assessment not found', 'not_found', 404);
    const pid = require('crypto').randomBytes(16).toString('hex');
    await db.insert('assessment_sessions', { public_id: pid, template_id: t.id, version_id: t.current_version_id, locale: locale(body?.locale) });
    return { session_id: pid };
  },
  async progress(req: Request, body: any) {
    if (!(await Settings.get('track_steps'))) return { ok: true };
    await RateLimit.hit(req, 'progress', 300, 3600);
    const pid = String(body?.session_id ?? '');
    if (!/^[a-f0-9]{32}$/.test(pid)) throw new ApiError('Invalid session', 'validation', 422);
    const step = Math.max(0, Math.min(50, int(body?.step)));
    const steps = Math.max(0, Math.min(50, int(body?.steps)));
    await db.run('UPDATE assessment_sessions SET max_step = GREATEST(max_step, ?), step_count = GREATEST(step_count, ?), last_seen_at = ? WHERE public_id = ? AND completed_at IS NULL',
      [step, steps, now(), pid]);
    return { ok: true };
  },
};
