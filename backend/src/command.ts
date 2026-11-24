/**
 * Command Centre endpoints: executive dashboard, search, notifications, activity, preferences,
 * security centre, system health, CRM extras (pipeline, bulk updates) and redirects.
 * Every route is capability-checked server-side; nothing here is invented — all values come
 * from database records or live checks, and unknowns are reported as unknown.
 */
import fs from 'fs';
import { Router, Request } from 'express';
import { db, now } from './db';
import { h, ApiError, int } from './http';
import { audit, requireCap, can, CAPS, ROLES, SESSION_HOURS, IDLE_MINUTES } from './auth';
import { Crypto } from './security';
import { Leads, STATUSES } from './leads';
import { analytics } from './analytics';
import { loadConfig } from './config';
import { Redirects, validateRedirect } from './redirects';
import { SERVICES } from './i18n';

export const commandRouter = Router();
const uid = (req: Request) => req.user!.id;
const L = (v: any) => (v && typeof v === 'object' ? v.en ?? '' : v ?? '');
const iso = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');
const day = (d: Date) => d.toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : null);
const ts = (s: string) => new Date(s.replace(' ', 'T') + 'Z');

/* --------------------------------- Periods --------------------------------- */
export type Period = { key: string; start: Date; end: Date; prevStart: Date; prevEnd: Date; bucket: 'day' | 'week' | 'month'; label: string };
const PERIODS = ['today', '7d', '30d', '90d', 'month', 'quarter', 'year', 'custom'];

/** Resolve a reporting period to [start, end) in UTC plus the previous period of equal length. */
export function resolvePeriod(q: Record<string, unknown>, nowDate = new Date()): Period {
  const key = PERIODS.includes(String(q.period)) ? String(q.period) : '30d';
  const today = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 86400_000);
  let start: Date; let end = tomorrow; let label = '';
  const back = (days: number) => new Date(tomorrow.getTime() - days * 86400_000);
  switch (key) {
    case 'today': start = today; label = 'Today'; break;
    case '7d': start = back(7); label = 'Last 7 days'; break;
    case '90d': start = back(90); label = 'Last 90 days'; break;
    case 'month': start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); label = 'This month'; break;
    case 'quarter': start = new Date(Date.UTC(today.getUTCFullYear(), Math.floor(today.getUTCMonth() / 3) * 3, 1)); label = 'This quarter'; break;
    case 'year': start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1)); label = 'This year'; break;
    case 'custom': {
      const f = /^\d{4}-\d{2}-\d{2}$/.test(String(q.from)) ? new Date(String(q.from) + 'T00:00:00Z') : null;
      const t = /^\d{4}-\d{2}-\d{2}$/.test(String(q.to)) ? new Date(String(q.to) + 'T00:00:00Z') : null;
      if (!f || !t || isNaN(f.getTime()) || isNaN(t.getTime())) throw new ApiError('Choose a start and end date.', 'validation', 422);
      if (t < f) throw new ApiError('The end date must be on or after the start date.', 'validation', 422);
      if ((t.getTime() - f.getTime()) / 86400_000 > 3 * 366) throw new ApiError('Custom ranges can be at most three years.', 'validation', 422);
      start = f; end = new Date(t.getTime() + 86400_000); label = `${day(f)} – ${day(t)}`; break;
    }
    default: start = back(30); label = 'Last 30 days';
  }
  const len = end.getTime() - start.getTime();
  const days = len / 86400_000;
  const want = String(q.bucket ?? '');
  const bucket = (['day', 'week', 'month'].includes(want) ? want : days <= 45 ? 'day' : days <= 200 ? 'week' : 'month') as Period['bucket'];
  return { key, start, end, prevStart: new Date(start.getTime() - len), prevEnd: start, bucket, label };
}

/** Bucket key for a timestamp: YYYY-MM-DD (day), ISO-week Monday (week), YYYY-MM (month). */
export function bucketKey(d: Date, b: Period['bucket']): string {
  if (b === 'month') return d.toISOString().slice(0, 7);
  if (b === 'week') { const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const dow = (m.getUTCDay() + 6) % 7; m.setUTCDate(m.getUTCDate() - dow); return day(m); }
  return day(d);
}
export function bucketKeys(p: Period): string[] {
  const out: string[] = []; const seen = new Set<string>();
  for (let t = p.start.getTime(); t < p.end.getTime(); t += 86400_000) { const k = bucketKey(new Date(t), p.bucket); if (!seen.has(k)) { seen.add(k); out.push(k); } }
  return out;
}

async function times(sql: string, params: unknown[]): Promise<Date[]> {
  return (await db.all(sql, params)).map((r) => ts(String(Object.values(r)[0])));
}

/* -------------------------------- Dashboard -------------------------------- */
const QUALIFIED = ['qualified', 'consultation_scheduled', 'proposal_sent', 'converted'];

async function kpiValues(start: Date, end: Date) {
  const a = [iso(start), iso(end)];
  const n = async (sql: string) => Number(await db.val(sql, a));
  const starts = await n('SELECT COUNT(*) FROM assessment_sessions WHERE started_at >= ? AND started_at < ?');
  const startsDone = await n('SELECT COUNT(*) FROM assessment_sessions WHERE started_at >= ? AND started_at < ? AND completed_at IS NOT NULL');
  const completed = await n('SELECT COUNT(*) FROM assessments WHERE created_at >= ? AND created_at < ?');
  const leads = await n('SELECT COUNT(*) FROM leads WHERE created_at >= ? AND created_at < ?');
  const qualified = await n(`SELECT COUNT(*) FROM leads WHERE created_at >= ? AND created_at < ? AND status IN (${QUALIFIED.map((s) => `'${s}'`).join(',')})`);
  const consultations = await n('SELECT COUNT(*) FROM leads WHERE created_at >= ? AND created_at < ? AND wants_consultation = 1');
  const converted = await n("SELECT COUNT(*) FROM leads WHERE created_at >= ? AND created_at < ? AND status = 'converted'");
  const enquiries = await n("SELECT COUNT(*) FROM leads WHERE created_at >= ? AND created_at < ? AND source = 'contact'");
  return { starts, completed, completion_rate: pct(startsDone, starts), leads, qualified, consultations, conversion_rate: pct(converted, leads), enquiries };
}

commandRouter.get('/dashboard', requireCap('view'), h(async (req) => {
  const p = resolvePeriod(req.query);
  const cur = await kpiValues(p.start, p.end);
  const prev = await kpiValues(p.prevStart, p.prevEnd);
  // Whether there is any record at all before the period (otherwise a comparison is meaningless).
  const history = Number(await db.val('SELECT (SELECT COUNT(*) FROM assessment_sessions WHERE started_at < ?) + (SELECT COUNT(*) FROM leads WHERE created_at < ?)', [iso(p.start), iso(p.start)])) > 0;

  const keys = bucketKeys(p);
  const series = (dates: Date[]) => { const m = new Map(keys.map((k) => [k, 0])); for (const d of dates) { const k = bucketKey(d, p.bucket); if (m.has(k)) m.set(k, m.get(k)! + 1); } return keys.map((k) => m.get(k)!); };
  const rng = [iso(p.start), iso(p.end)];
  const sStarts = series(await times('SELECT started_at FROM assessment_sessions WHERE started_at >= ? AND started_at < ? LIMIT 100000', rng));
  const sDone = series(await times('SELECT created_at FROM assessments WHERE created_at >= ? AND created_at < ? LIMIT 100000', rng));
  const sLeads = series(await times('SELECT created_at FROM leads WHERE created_at >= ? AND created_at < ? LIMIT 100000', rng));
  const sCons = series(await times('SELECT created_at FROM leads WHERE created_at >= ? AND created_at < ? AND wants_consultation = 1 LIMIT 100000', rng));
  const sEnq = series(await times("SELECT created_at FROM leads WHERE created_at >= ? AND created_at < ? AND source = 'contact' LIMIT 100000", rng));
  const sQual = series(await times(`SELECT created_at FROM leads WHERE created_at >= ? AND created_at < ? AND status IN (${QUALIFIED.map((s) => `'${s}'`).join(',')}) LIMIT 100000`, rng));

  const pipeline = (await db.all('SELECT status, COUNT(*) n FROM leads GROUP BY status')).map((r) => ({ status: r.status, n: Number(r.n) }));

  // Maturity: aggregates only (no organisation-level findings).
  const an = await analytics({ from: day(p.start), to: day(new Date(p.end.getTime() - 86400_000)) });
  const catNames = new Map((await db.all('SELECT `key`, data FROM categories')).map((c) => [c.key, L(JSON.parse(c.data).name) || c.key]));
  const qTitles = new Map((await db.all('SELECT code, data FROM questions')).map((q) => [q.code, L(JSON.parse(q.data).title) || q.code]));
  const svc: Record<string, number> = {};
  let coverageSum = 0; let coverageN = 0;
  for (const r of await db.all('SELECT result_enc, coverage FROM assessments WHERE created_at >= ? AND created_at < ? ORDER BY id DESC LIMIT 1000', rng)) {
    if (r.coverage !== null) { coverageSum += Number(r.coverage); coverageN++; }
    const res: any = Crypto.decryptJson(r.result_enc);
    for (const s of res?.services ?? []) svc[s] = (svc[s] ?? 0) + 1;
  }
  const maturity = {
    sample: an.completed, avg_score: an.avg_score, avg_coverage: coverageN ? Math.round((10 * coverageSum) / coverageN) / 10 : null,
    categories: an.categories.map((c) => ({ key: c.key, name: catNames.get(c.key) ?? c.key, avg: c.avg, n: c.n })),
    gaps: an.gaps.slice(0, 6).map((g) => ({ code: g.code, title: qTitles.get(g.code) ?? g.code, n: g.n, pct: g.pct })),
    services: Object.entries(svc).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => ({ key: k, name: L(SERVICES[k]) || k, n })),
    by_classification: an.by_classification,
  };

  const media = Number(await db.val('SELECT COUNT(*) FROM media'));
  const recentContent = await db.all(`SELECT r.doc_key, r.action, r.created_at, u.name user_name FROM content_revisions r LEFT JOIN users u ON u.id = r.user_id ORDER BY r.id DESC LIMIT 6`);
  const templates = Number(await db.val("SELECT COUNT(*) FROM templates WHERE status = 'published' AND deleted_at IS NULL"));

  return {
    period: { key: p.key, label: p.label, from: day(p.start), to: day(new Date(p.end.getTime() - 86400_000)), prev_from: day(p.prevStart), prev_to: day(new Date(p.prevEnd.getTime() - 86400_000)), bucket: p.bucket, generated_at: now() },
    has_history: history,
    kpis: { current: cur, previous: prev },
    series: { keys, starts: sStarts, completed: sDone, leads: sLeads, consultations: sCons, enquiries: sEnq, qualified: sQual },
    pipeline, maturity, website: { media, recent: recentContent, published_templates: templates },
  };
}));

/* ------------------------------ Activity feed ------------------------------ */
type Event = { id: string; type: string; title: string; detail?: string; at: string; actor?: string | null; href?: string; tone?: 'ok' | 'warn' | 'risk' | 'brand' | 'neutral' };

const AUDIT_LABELS: Record<string, [string, string?]> = {
  'content.save': ['Website content saved'], 'content.reset': ['Website content reset to original'], 'content.restore': ['Website revision restored'],
  'template.publish': ['Assessment published'], 'template.unpublish': ['Assessment unpublished'], 'template.create': ['Assessment draft created'], 'template.update': ['Assessment updated'], 'template.duplicate': ['Assessment duplicated'], 'template.archive': ['Assessment archived'], 'template.delete': ['Assessment deleted'], 'template.questions': ['Assessment questions changed'],
  'question.create': ['Question created'], 'question.update': ['Question updated'], 'question.delete': ['Question deleted'], 'question.archive': ['Question archived'],
  'rule.create': ['Recommendation rule created'], 'rule.update': ['Recommendation rule updated'], 'rule.delete': ['Recommendation rule deleted'],
  'category.create': ['Category created'], 'category.update': ['Category updated'], 'category.delete': ['Category deleted'], 'scoring.update': ['Scoring configuration changed'],
  'media.upload': ['Image uploaded'], 'media.delete': ['Image deleted'], 'settings.update': ['Settings changed'], 'retention.run': ['Data retention ran'],
  'user.create': ['User added'], 'user.update': ['User changed'], 'user.password_changed': ['Password changed'],
  'report.link_created': ['Report link created'], 'report.revoke': ['Report link revoked'],
  'lead.update': ['Lead updated'], 'lead.note': ['Note added to lead'], 'lead.erase': ['Lead erased'], 'leads.export': ['Leads exported'], 'assessments.export': ['Assessments exported'],
  'redirect.create': ['Redirect added'], 'redirect.update': ['Redirect changed'], 'redirect.delete': ['Redirect removed'],
  'auth.login': ['Signed in'], 'auth.login_failed': ['Failed sign-in (wrong password)'], 'auth.code_failed': ['Failed sign-in (wrong code)'], 'auth.mfa_reset': ['Two-factor reset'], 'auth.recovery_code_used': ['Backup code used'], 'auth.denied': ['Permission denied'], 'auth.session_revoked': ['Session signed out'],
};
const SECURITY_ACTIONS = ['auth.login', 'auth.login_failed', 'auth.code_failed', 'auth.mfa_reset', 'auth.recovery_code_used', 'auth.denied', 'auth.session_revoked', 'auth.mfa_enabled', 'auth.recovery_regenerated', 'auth.devices_forgotten'];
const LEAD_ACTIONS = ['lead.update', 'lead.note', 'lead.erase', 'leads.export', 'report.link_created', 'report.revoke', 'assessments.export'];

function auditHref(a: any): string | undefined {
  if (a.entity === 'lead' && a.entity_id) return `leads/${a.entity_id}`;
  if (a.entity === 'template' && a.entity_id) return `templates/${a.entity_id}`;
  if (a.entity === 'content' && a.entity_id) return `website/${encodeURIComponent(a.entity_id)}`;
  if (a.action.startsWith('media.')) return 'media';
  if (a.action.startsWith('user.')) return 'users';
  if (a.action.startsWith('redirect.')) return 'redirects';
  if (a.action.startsWith('auth.')) return 'security';
  return undefined;
}

/** Events visible to this user, newest first. Lead names are only shown to roles that may see leads. */
async function events(req: Request, opts: { since?: string; limit?: number; types?: string[] } = {}): Promise<Event[]> {
  const u = req.user!; const lim = Math.min(200, opts.limit ?? 30);
  const since = opts.since ?? now(-90 * 86400);
  const out: Event[] = [];
  const want = (t: string) => !opts.types || opts.types.includes(t);
  if (want('lead') || want('consultation') || want('enquiry')) {
    for (const l of await db.all(`SELECT id, public_ref, source, wants_consultation, company_enc, created_at FROM leads WHERE created_at >= ? ORDER BY id DESC LIMIT ${lim}`, [since])) {
      const who = can(u, 'leads') ? Crypto.decrypt(l.company_enc) || l.public_ref : l.public_ref;
      const type = l.wants_consultation ? 'consultation' : l.source === 'contact' ? 'enquiry' : 'lead';
      if (!want(type)) continue;
      out.push({ id: `lead-${l.id}`, type, title: type === 'consultation' ? 'Consultation requested' : type === 'enquiry' ? 'New contact enquiry' : 'New lead', detail: `${who} · ${l.source}`, at: l.created_at, href: can(u, 'leads') ? `leads/${l.id}` : undefined, tone: type === 'consultation' ? 'brand' : 'ok' });
    }
  }
  if (want('assessment')) {
    for (const a of await db.all(`SELECT a.id, a.public_ref, a.overall_score, a.classification, a.created_at, t.slug FROM assessments a JOIN templates t ON t.id = a.template_id WHERE a.created_at >= ? ORDER BY a.id DESC LIMIT ${lim}`, [since])) {
      out.push({ id: `assessment-${a.id}`, type: 'assessment', title: 'Assessment completed', detail: `${a.slug} · ${a.public_ref}${a.overall_score !== null ? ` · score ${a.overall_score}` : ''}`, at: a.created_at, href: can(u, 'assessments') ? `assessments/${a.id}` : undefined, tone: 'neutral' });
    }
  }
  if (want('email_failed') && can(u, 'settings')) {
    for (const m of await db.all(`SELECT id, kind, last_error, created_at FROM email_outbox WHERE status = 'failed' AND created_at >= ? ORDER BY id DESC LIMIT ${lim}`, [since])) {
      out.push({ id: `email-${m.id}`, type: 'email_failed', title: 'Email delivery failed', detail: `${m.kind}${m.last_error ? ` · ${String(m.last_error).slice(0, 120)}` : ''}`, at: m.created_at, href: 'emails', tone: 'risk' });
    }
  }
  if (want('audit') || want('security')) {
    const allowed: string[] = [];
    const all = Object.keys(AUDIT_LABELS);
    for (const k of all) {
      if (SECURITY_ACTIONS.includes(k)) { if (want('security') && can(u, 'audit') && (k !== 'auth.login' || opts.types?.includes('security'))) allowed.push(k); continue; }
      if (!want('audit')) continue;
      if (LEAD_ACTIONS.includes(k) && !can(u, 'leads')) continue;
      allowed.push(k);
    }
    if (allowed.length) {
      const rows = await db.all(`SELECT a.id, a.action, a.entity, a.entity_id, a.meta, a.created_at, us.name user_name FROM audit_log a LEFT JOIN users us ON us.id = a.user_id
        WHERE a.created_at >= ? AND a.action IN (${allowed.map(() => '?').join(',')}) ORDER BY a.id DESC LIMIT ${lim}`, [since, ...allowed]);
      for (const a of rows) {
        const sec = SECURITY_ACTIONS.includes(a.action);
        const meta = a.meta ? JSON.parse(a.meta) : {};
        let detail = sec ? '' : a.entity === 'content' ? String(a.entity_id) : a.entity && a.entity_id ? `${a.entity} #${a.entity_id}` : '';
        if (a.action === 'lead.update' && meta.to?.status) detail = `${detail} · status → ${String(meta.to.status).replace(/_/g, ' ')}`;
        if (sec && meta.device) detail = `${detail ? detail + ' · ' : ''}${meta.device}`;
        out.push({ id: `audit-${a.id}`, type: sec ? 'security' : 'audit', title: AUDIT_LABELS[a.action]?.[0] ?? a.action, detail, at: a.created_at, actor: a.user_name ?? 'System', href: auditHref(a),
          tone: /failed|denied/.test(a.action) ? 'risk' : /reset|erase|delete/.test(a.action) ? 'warn' : 'neutral' });
      }
    }
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, lim);
}

commandRouter.get('/activity', requireCap('view'), h(async (req) => {
  const type = String(req.query.type ?? '');
  const types = type ? type.split(',').filter((t) => ['lead', 'consultation', 'enquiry', 'assessment', 'audit', 'security', 'email_failed'].includes(t)) : undefined;
  return { events: await events(req, { limit: int(req.query.limit, 40), types }) };
}));

/* ------------------------------ Preferences ------------------------------ */
const PREF_KEYS: Record<string, (v: any) => boolean> = {
  theme: (v) => ['light', 'dark', 'system'].includes(v),
  sidebar: (v) => ['expanded', 'collapsed'].includes(v),
  notif_prefs: (v) => !!v && typeof v === 'object' && Object.entries(v).every(([k, x]) => NOTIF_TYPES.includes(k) && typeof x === 'boolean'),
  dashboard_period: (v) => PERIODS.includes(v) && v !== 'custom',
};
const NOTIF_TYPES = ['lead', 'consultation', 'enquiry', 'assessment', 'email_failed', 'security'];
async function prefs(userId: number): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  for (const r of await db.all('SELECT `key`, `value` FROM user_prefs WHERE user_id = ?', [userId])) { try { out[r.key] = JSON.parse(r.value); } catch { /* ignore */ } }
  return out;
}
async function setPref(userId: number, key: string, value: unknown) {
  await db.run('INSERT INTO user_prefs (user_id, `key`, `value`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [userId, key, JSON.stringify(value)]);
}
commandRouter.get('/prefs', requireCap('view'), h(async (req) => {
  const p = await prefs(uid(req));
  return { prefs: { theme: p.theme ?? 'system', sidebar: p.sidebar ?? 'expanded', dashboard_period: p.dashboard_period ?? '30d', notif_prefs: { ...Object.fromEntries(NOTIF_TYPES.map((t) => [t, true])), ...(p.notif_prefs ?? {}) } } };
}));
commandRouter.put('/prefs', requireCap('view'), h(async (req) => {
  const body = req.body?.prefs;
  if (!body || typeof body !== 'object') throw new ApiError('prefs must be an object', 'validation', 422);
  for (const [k, v] of Object.entries(body)) {
    if (!PREF_KEYS[k]) throw new ApiError(`Unknown preference: ${k}`, 'validation', 422);
    if (!PREF_KEYS[k](v)) throw new ApiError(`Invalid value for ${k}`, 'validation', 422);
    await setPref(uid(req), k, v);
  }
  return { ok: true };
}));

/* ------------------------------ Notifications ------------------------------ */
async function notificationState(req: Request) {
  const p = await prefs(uid(req));
  const readAt: string = p.notif_read_at ?? now(-30 * 86400);
  const readIds: string[] = Array.isArray(p.notif_read_ids) ? p.notif_read_ids : [];
  const on = { ...Object.fromEntries(NOTIF_TYPES.map((t) => [t, true])), ...(p.notif_prefs ?? {}) } as Record<string, boolean>;
  const types = NOTIF_TYPES.filter((t) => on[t]);
  const list = types.length ? await events(req, { since: now(-30 * 86400), limit: 60, types }) : [];
  // Security notifications: only failures and resets, not every successful sign-in.
  const items = list.filter((e) => e.type !== 'security' || e.tone === 'risk' || /reset|Backup code/.test(e.title))
    .map((e) => ({ ...e, read: e.at <= readAt || readIds.includes(e.id) }));
  return { items, unread: items.filter((i) => !i.read).length, readAt, readIds };
}
commandRouter.get('/notifications', requireCap('view'), h(async (req) => {
  const s = await notificationState(req);
  return { notifications: s.items, unread: s.unread };
}));
commandRouter.post('/notifications/read', requireCap('view'), h(async (req) => {
  if (req.body?.all) { await setPref(uid(req), 'notif_read_at', now()); await setPref(uid(req), 'notif_read_ids', []); return { ok: true }; }
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x: unknown) => typeof x === 'string' && /^[a-z_]+-\d+$/.test(x as string)).slice(0, 100) : [];
  const s = await notificationState(req);
  await setPref(uid(req), 'notif_read_ids', [...new Set([...ids, ...s.readIds])].slice(0, 500));
  return { ok: true };
}));

/* ------------------------- Sidebar counts + attention ------------------------- */
commandRouter.get('/counts', requireCap('view'), h(async (req) => {
  const u = req.user!; const out: Record<string, number | null> = {};
  if (can(u, 'leads')) {
    out.new_leads = Number(await db.val("SELECT COUNT(*) FROM leads WHERE status = 'new'"));
    out.consultations_new = Number(await db.val("SELECT COUNT(*) FROM leads WHERE status = 'new' AND wants_consultation = 1"));
    out.enquiries_new = Number(await db.val("SELECT COUNT(*) FROM leads WHERE status = 'new' AND source = 'contact'"));
    out.follow_ups_due = Number(await db.val("SELECT COUNT(*) FROM leads WHERE next_follow_up_at IS NOT NULL AND next_follow_up_at <= ? AND status NOT IN ('converted','closed')", [now()]));
  }
  if (can(u, 'settings')) out.emails_failed = Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'failed'"));
  out.notifications = (await notificationState(req)).unread;
  return { counts: out };
}));

commandRouter.get('/attention', requireCap('view'), h(async (req) => {
  const u = req.user!; const items: { key: string; severity: 'high' | 'medium' | 'low'; title: string; detail: string; count: number; href: string }[] = [];
  const add = (key: string, severity: 'high' | 'medium' | 'low', count: number, title: string, detail: string, href: string) => { if (count > 0) items.push({ key, severity, title, detail, count, href }); };
  if (can(u, 'leads')) {
    add('consultations', 'high', Number(await db.val("SELECT COUNT(*) FROM leads WHERE status = 'new' AND wants_consultation = 1")), 'Consultation requests waiting', 'New requests that have not been contacted yet.', 'consultations');
    add('follow_ups', 'high', Number(await db.val("SELECT COUNT(*) FROM leads WHERE next_follow_up_at IS NOT NULL AND next_follow_up_at <= ? AND status NOT IN ('converted','closed')", [now()])), 'Follow-ups due', 'Leads whose follow-up date has passed.', 'follow-ups');
    add('enquiries', 'medium', Number(await db.val("SELECT COUNT(*) FROM leads WHERE status = 'new' AND source = 'contact'")), 'Unanswered contact enquiries', 'Contact form messages still marked new.', 'enquiries');
    add('stale', 'medium', Number(await db.val("SELECT COUNT(*) FROM leads WHERE status = 'new' AND created_at < ?", [now(-3 * 86400)])), 'Leads older than 3 days still new', 'Consider contacting or closing them.', 'leads?status=new');
  }
  if (can(u, 'settings')) {
    add('emails_failed', 'high', Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'failed'")), 'Failed email deliveries', 'Emails that could not be delivered after all retries.', 'emails');
    add('emails_stuck', 'medium', Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'queued' AND created_at < ?", [now(-3600)])), 'Emails waiting more than an hour', 'Check that the scheduled task (cron) is running.', 'health');
  }
  if (can(u, 'audit')) {
    add('failed_logins', 'medium', Number(await db.val("SELECT COUNT(*) FROM audit_log WHERE action IN ('auth.login_failed','auth.code_failed') AND created_at >= ?", [now(-86400)])), 'Failed sign-in attempts (24 hours)', 'Wrong passwords or codes on admin accounts.', 'security');
    add('locked', 'high', Number(await db.val('SELECT COUNT(*) FROM users WHERE locked_until IS NOT NULL AND locked_until > ?', [now()])), 'Locked accounts', 'Accounts locked after repeated failed sign-ins.', 'security');
  }
  if (can(u, 'users')) add('no_mfa', 'low', Number(await db.val('SELECT COUNT(*) FROM users u LEFT JOIN user_mfa m ON m.user_id = u.id WHERE u.active = 1 AND m.user_id IS NULL')), 'Users without two-factor yet', 'They will be asked to set it up at their next sign-in.', 'users');
  return { items };
}));

/* --------------------------------- Search --------------------------------- */
commandRouter.get('/search', requireCap('view'), h(async (req) => {
  const q = String(req.query.q ?? '').trim().toLowerCase().slice(0, 80);
  if (q.length < 2) return { results: [] };
  const u = req.user!; const out: { group: string; title: string; detail?: string; href: string }[] = [];
  const like = `%${q.replace(/[%_]/g, '')}%`;
  if (can(u, 'leads')) {
    let n = 0;
    for (const l of await db.all('SELECT * FROM leads ORDER BY id DESC LIMIT 3000')) {
      const d = Leads.decrypt(l);
      const hay = [d.name, d.company, d.email, d.ref].map((v) => (v ?? '').toLowerCase()).join(' ');
      if (q.split(/\s+/).every((w) => hay.includes(w))) { out.push({ group: 'Leads', title: d.company || d.name || d.ref, detail: `${d.name ?? ''} · ${d.status.replace(/_/g, ' ')}`, href: `leads/${d.id}` }); if (++n >= 6) break; }
    }
  }
  if (can(u, 'assessments')) {
    for (const a of await db.all('SELECT a.id, a.public_ref, a.overall_score, t.slug FROM assessments a JOIN templates t ON t.id = a.template_id WHERE a.public_ref LIKE ? ORDER BY a.id DESC LIMIT 5', [like]))
      out.push({ group: 'Assessments', title: a.public_ref, detail: `${a.slug}${a.overall_score !== null ? ` · score ${a.overall_score}` : ''}`, href: `assessments/${a.id}` });
  }
  for (const t of await db.all('SELECT id, slug, data, status FROM templates WHERE deleted_at IS NULL AND (slug LIKE ? OR data LIKE ?) LIMIT 5', [like, like]))
    out.push({ group: 'Assessment templates', title: L(JSON.parse(t.data).name) || t.slug, detail: `${t.slug} · ${t.status}`, href: `templates/${t.id}` });
  for (const qq of await db.all('SELECT code, data FROM questions WHERE code LIKE ? OR data LIKE ? LIMIT 5', [like, like]))
    out.push({ group: 'Questions', title: L(JSON.parse(qq.data).title) || qq.code, detail: qq.code, href: `questions?q=${encodeURIComponent(qq.code)}` });
  for (const m of await db.all('SELECT id, original_name, alt FROM media WHERE original_name LIKE ? OR alt LIKE ? ORDER BY id DESC LIMIT 5', [like, like]))
    out.push({ group: 'Media', title: m.original_name, detail: m.alt ?? undefined, href: `media?q=${encodeURIComponent(m.original_name)}` });
  if (can(u, 'users')) for (const x of await db.all('SELECT id, name, email, role FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 5', [like, like]))
    out.push({ group: 'Users', title: x.name, detail: `${x.email} · ${x.role}`, href: 'users' });
  return { results: out };
}));

/* ------------------------------ CRM: pipeline ------------------------------ */
commandRouter.get('/leads/pipeline', requireCap('leads'), h(async (req) => {
  const rows = await db.all(`SELECT l.*, a.overall_score, u.name assigned_name FROM leads l LEFT JOIN assessments a ON a.id = l.assessment_id LEFT JOIN users u ON u.id = l.assigned_to
    WHERE l.status NOT IN ('converted','closed') OR l.updated_at >= ? ORDER BY l.updated_at DESC LIMIT 600`, [now(-90 * 86400)]);
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const leads = rows.map((r) => ({ ...Leads.decrypt(r), overall_score: r.overall_score, assigned_name: r.assigned_name }))
    .filter((l) => !q || [l.name, l.company, l.email, l.ref].some((v) => (v ?? '').toLowerCase().includes(q)))
    .map((l) => ({ id: l.id, ref: l.ref, name: l.name, company: l.company, source: l.source, status: l.status, priority: l.priority, wants_consultation: l.wants_consultation, assigned_to: l.assigned_to, assigned_name: (l as any).assigned_name, next_follow_up_at: l.next_follow_up_at, created_at: l.created_at, updated_at: l.updated_at, industry: l.details.industry ?? l.details.sector ?? null }));
  return { statuses: STATUSES, leads, note: 'Converted and closed leads are shown when updated in the last 90 days.' };
}));

commandRouter.post('/leads/bulk', requireCap('leads'), h(async (req) => {
  const ids: number[] = Array.isArray(req.body?.ids) ? [...new Set<number>(req.body.ids.map((x: unknown) => int(x)).filter((n: number) => n > 0))].slice(0, 200) : [];
  if (!ids.length) throw new ApiError('Select at least one lead.', 'validation', 422);
  const row: Record<string, unknown> = {};
  if (req.body.status !== undefined) { if (!STATUSES.includes(req.body.status)) throw new ApiError('Invalid status', 'validation', 422); row.status = req.body.status; }
  if (req.body.priority !== undefined) { if (!['high', 'medium', 'low'].includes(req.body.priority)) throw new ApiError('Invalid priority', 'validation', 422); row.priority = req.body.priority; }
  if (req.body.assigned_to !== undefined) {
    const a = req.body.assigned_to === null || req.body.assigned_to === '' ? null : int(req.body.assigned_to);
    if (a !== null && !(await db.val('SELECT id FROM users WHERE id = ? AND active = 1', [a]))) throw new ApiError('Unknown user', 'validation', 422);
    row.assigned_to = a;
  }
  if (!Object.keys(row).length) throw new ApiError('Nothing to change.', 'validation', 422);
  let changed = 0;
  for (const id of ids) {
    const l = await db.one('SELECT id, status, priority, assigned_to, last_contacted_at FROM leads WHERE id = ?', [id]);
    if (!l) continue;
    const r = { ...row } as Record<string, unknown>;
    if (r.status === 'contacted' && !l.last_contacted_at) r.last_contacted_at = now();
    await db.update('leads', r, 'id = ?', [id]);
    await audit(uid(req), 'lead.update', 'lead', id, { from: { status: l.status, priority: l.priority, assigned_to: l.assigned_to }, to: row, bulk: true });
    changed++;
  }
  return { changed };
}));

commandRouter.get('/leads/:id/timeline', requireCap('leads'), h(async (req) => {
  const id = int(req.params.id);
  const l = await db.one('SELECT id, created_at, source FROM leads WHERE id = ?', [id]);
  if (!l) throw new ApiError('Not found', 'not_found', 404);
  const rows = await db.all(`SELECT a.id, a.action, a.meta, a.created_at, u.name user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
    WHERE a.entity = 'lead' AND a.entity_id = ? AND a.action <> 'lead.view' ORDER BY a.id DESC LIMIT 200`, [String(id)]);
  const users = new Map((await db.all('SELECT id, name FROM users')).map((x) => [Number(x.id), x.name]));
  const describe = (a: any) => {
    const m = a.meta ? JSON.parse(a.meta) : {};
    if (a.action === 'lead.update') {
      const parts: string[] = [];
      if (m.to?.status) parts.push(`status ${String(m.from?.status ?? '').replace(/_/g, ' ')} → ${String(m.to.status).replace(/_/g, ' ')}`);
      if (m.to?.priority) parts.push(`priority → ${m.to.priority}`);
      if ('assigned_to' in (m.to ?? {})) parts.push(`assigned to ${m.to.assigned_to ? users.get(Number(m.to.assigned_to)) ?? `user #${m.to.assigned_to}` : 'nobody'}`);
      if ('next_follow_up_at' in (m.to ?? {})) parts.push(m.to.next_follow_up_at ? `follow-up set for ${String(m.to.next_follow_up_at).slice(0, 10)}` : 'follow-up cleared');
      if ('last_contacted_at' in (m.to ?? {})) parts.push('marked as contacted');
      return parts.join(', ') || 'updated';
    }
    return AUDIT_LABELS[a.action]?.[0] ?? a.action;
  };
  return { events: [...rows.map((a) => ({ id: a.id, action: a.action, text: describe(a), at: a.created_at, actor: a.user_name ?? 'System' })), { id: 0, action: 'lead.created', text: `Lead created from ${l.source}`, at: l.created_at, actor: 'Website' }] };
}));

/* ------------------------------ Security centre ------------------------------ */
commandRouter.get('/security', requireCap('view'), h(async (req) => {
  const u = req.user!; const all = can(u, 'audit'); const cfg = loadConfig();
  const since = now(-30 * 86400);
  const scope = all ? '' : ' AND a.user_id = ?'; const sp = all ? [] : [u.id];
  const count = async (actions: string[], from = since) => Number(await db.val(`SELECT COUNT(*) FROM audit_log a WHERE a.created_at >= ? AND a.action IN (${actions.map(() => '?').join(',')})${scope}`, [from, ...actions, ...sp]));
  const stats = {
    logins_30d: await count(['auth.login']), failed_30d: await count(['auth.login_failed', 'auth.code_failed']), failed_24h: await count(['auth.login_failed', 'auth.code_failed'], now(-86400)),
    denied_30d: await count(['auth.denied']), recovery_used_30d: await count(['auth.recovery_code_used']), mfa_resets_30d: await count(['auth.mfa_reset']),
  };
  const evRows = await db.all(`SELECT a.id, a.action, a.meta, a.created_at, us.name user_name FROM audit_log a LEFT JOIN users us ON us.id = a.user_id
    WHERE a.created_at >= ? AND a.action IN (${SECURITY_ACTIONS.map(() => '?').join(',')})${scope} ORDER BY a.id DESC LIMIT 40`, [since, ...SECURITY_ACTIONS, ...sp]);
  const authEvents = evRows.map((a) => { const m = a.meta ? JSON.parse(a.meta) : {}; return { id: a.id, action: a.action, label: AUDIT_LABELS[a.action]?.[0] ?? a.action, at: a.created_at, user: a.user_name ?? 'Unknown', how: m.how ?? null, device: m.device ?? null, path: m.path ?? null, failed: /failed|denied/.test(a.action) }; });
  const sessions = (await db.all(`SELECT s.id, s.user_id, s.label, s.created_at, s.last_seen_at, s.expires_at, us.name, us.email FROM admin_sessions s JOIN users us ON us.id = s.user_id
    WHERE s.expires_at > ?${can(u, 'users') ? '' : ' AND s.user_id = ?'} ORDER BY s.last_seen_at DESC`, [now(), ...(can(u, 'users') ? [] : [u.id])]))
    .filter((s) => Date.now() - ts(s.last_seen_at).getTime() <= IDLE_MINUTES * 60_000)
    .map((s) => ({ id: s.id.slice(0, 16), user: s.name, email: s.email, user_id: s.user_id, label: s.label ?? 'Unknown browser', created_at: s.created_at, last_seen_at: s.last_seen_at, expires_at: s.expires_at, current: s.id === req.sid }));
  const users = can(u, 'users') ? (await db.all('SELECT us.id, us.name, us.email, us.role, us.active, us.last_login_at, us.locked_until, m.enabled_at mfa_enabled_at FROM users us LEFT JOIN user_mfa m ON m.user_id = us.id ORDER BY us.name')).map((x) => ({ ...x, locked: !!x.locked_until && ts(x.locked_until).getTime() > Date.now() })) : null;
  const permChanges = all ? (await db.all(`SELECT a.id, a.action, a.entity_id, a.meta, a.created_at, us.name user_name, t.name target FROM audit_log a LEFT JOIN users us ON us.id = a.user_id LEFT JOIN users t ON t.id = a.entity_id
    WHERE a.action IN ('user.create','user.update','auth.mfa_reset') ORDER BY a.id DESC LIMIT 15`)).map((a) => ({ id: a.id, action: a.action, at: a.created_at, by: a.user_name ?? 'System', target: a.target ?? `user #${a.entity_id}`, fields: (a.meta ? JSON.parse(a.meta).fields : null) ?? null })) : null;

  const activeUsers = Number(await db.val('SELECT COUNT(*) FROM users WHERE active = 1'));
  const mfaUsers = Number(await db.val('SELECT COUNT(*) FROM users us JOIN user_mfa m ON m.user_id = us.id WHERE us.active = 1'));
  const owners = Number(await db.val("SELECT COUNT(*) FROM users WHERE role = 'owner' AND active = 1"));
  const lastRetention = await db.val("SELECT MAX(created_at) FROM audit_log WHERE action = 'retention.run'");
  const https = cfg.siteUrl.startsWith('https://');
  const prod = cfg.env === 'production';
  const checks = [
    { key: 'mfa', label: 'Two-factor sign-in required for every admin account', status: 'pass', detail: 'Enforced by the application at sign-in; it cannot be skipped.' },
    { key: 'mfa_enrolled', label: 'Active users who have completed two-factor setup', status: mfaUsers === activeUsers ? 'pass' : 'warn', detail: `${mfaUsers} of ${activeUsers}. Users who have not set it up are asked at their next sign-in.` },
    { key: 'https', label: 'Website address uses HTTPS', status: https ? 'pass' : prod ? 'fail' : 'info', detail: https ? 'Secure cookies and HSTS are sent in production.' : 'The configured SITE_URL is not https (expected for local preview only).' },
    { key: 'env', label: 'Running in production mode', status: prod ? 'pass' : 'info', detail: prod ? 'Secure cookies and strict headers are on.' : `Current mode: ${cfg.env}. Expected for local preview.` },
    { key: 'sessions', label: 'Session limits', status: 'pass', detail: `Sessions end after ${SESSION_HOURS} hours, or ${IDLE_MINUTES} minutes without activity.` },
    { key: 'lockout', label: 'Account lockout after repeated failures', status: 'pass', detail: '5 wrong passwords or codes lock the account for 15 minutes.' },
    { key: 'encryption', label: 'Personal data and assessment answers encrypted at rest', status: 'pass', detail: 'AES-256-GCM with the application key; email lookups use a keyed hash.' },
    { key: 'owners', label: 'More than one active owner (recovery if one is locked out)', status: owners > 1 ? 'pass' : 'warn', detail: `${owners} active owner${owners === 1 ? '' : 's'}. With one owner, recovery needs server access (reset-2fa command).` },
    { key: 'mail', label: 'Email delivery configured', status: cfg.mail.driver === 'log' ? (prod ? 'fail' : 'info') : 'pass', detail: cfg.mail.driver === 'log' ? 'Emails are written to files, not sent (local preview).' : `Using ${cfg.mail.driver}. Sign-in alerts and lead notifications are sent by email.` },
    { key: 'retention', label: 'Data retention has run in the last 48 hours', status: lastRetention && Date.now() - ts(String(lastRetention)).getTime() < 48 * 3600_000 ? 'pass' : 'warn', detail: lastRetention ? `Last run ${lastRetention} UTC.` : 'No run recorded yet. Check the daily scheduled task (cron).' },
    { key: 'backups', label: 'Database backups', status: 'unknown', detail: 'Not monitored by this application. Check your hosting backup settings in cPanel.' },
  ];
  const recommendations = checks.filter((c) => c.status === 'warn' || c.status === 'fail').map((c) => c.key === 'owners' ? 'Add a second owner account so the business is not dependent on one person\'s phone.' : c.key === 'mfa_enrolled' ? 'Ask the listed users to sign in and complete two-factor setup, or disable unused accounts.' : c.key === 'retention' ? 'Confirm the daily cron job (node dist/cron.js) is configured in cPanel.' : c.key === 'mail' ? 'Configure SMTP or sendmail so alerts are delivered.' : c.key === 'https' ? 'Set SITE_URL to the https:// address.' : c.label);
  if (stats.failed_24h >= 5) recommendations.unshift('Several failed sign-ins in the last 24 hours. Review the events below and confirm they were your own attempts.');
  return { scope: all ? 'all' : 'self', stats, events: authEvents, sessions, users, permission_changes: permChanges, checks, recommendations };
}));

commandRouter.delete('/sessions/:sid', requireCap('view'), h(async (req, res) => {
  const prefix = String(req.params.sid ?? '');
  if (!/^[a-f0-9]{16}$/.test(prefix)) throw new ApiError('Not found', 'not_found', 404);
  const s = await db.one('SELECT id, user_id FROM admin_sessions WHERE id LIKE ?', [`${prefix}%`]);
  if (!s) throw new ApiError('Not found', 'not_found', 404);
  if (s.user_id !== uid(req) && !can(req.user, 'users')) throw new ApiError('You do not have permission for this action.', 'forbidden', 403);
  await db.run('DELETE FROM admin_sessions WHERE id = ?', [s.id]);
  await audit(uid(req), 'auth.session_revoked', 'user', s.user_id);
  if (s.id === req.sid) res.append('Set-Cookie', 'bk_admin=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0');
  return { ok: true, self: s.id === req.sid };
}));

commandRouter.get('/roles', requireCap('view'), h(async () => ({ roles: ROLES, caps: CAPS })));

/* -------------------------------- System health -------------------------------- */
commandRouter.get('/health', requireCap('settings'), h(async () => {
  const cfg = loadConfig(); const checked_at = now();
  const checks: { key: string; label: string; status: 'ok' | 'warn' | 'fail' | 'unknown' | 'not_available'; detail: string; latency_ms?: number; last_ok?: string | null }[] = [];
  checks.push({ key: 'app', label: 'Application', status: 'ok', detail: `Responding. Up for ${Math.floor(process.uptime() / 3600)} h ${Math.floor((process.uptime() % 3600) / 60)} min.` });
  try { const t = Date.now(); await db.val('SELECT 1'); checks.push({ key: 'database', label: 'Database connection', status: 'ok', detail: 'Query succeeded.', latency_ms: Date.now() - t }); }
  catch { checks.push({ key: 'database', label: 'Database connection', status: 'fail', detail: 'The database did not respond.' }); }
  try { fs.accessSync(cfg.mediaDir, fs.constants.W_OK); checks.push({ key: 'media', label: 'Media storage', status: 'ok', detail: `Writable. ${Number(await db.val('SELECT COUNT(*) FROM media'))} images stored.` }); }
  catch { checks.push({ key: 'media', label: 'Media storage', status: fs.existsSync(cfg.mediaDir) ? 'fail' : 'warn', detail: fs.existsSync(cfg.mediaDir) ? 'The media folder is not writable.' : 'The media folder does not exist yet; it is created on the first upload.' }); }
  const lastSent = await db.val("SELECT MAX(sent_at) FROM email_outbox WHERE status = 'sent'");
  const failed = Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'failed'"));
  const queued = Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'queued'"));
  const oldest = await db.val("SELECT MIN(created_at) FROM email_outbox WHERE status = 'queued'");
  const stuck = oldest ? Date.now() - ts(String(oldest)).getTime() > 3600_000 : false;
  checks.push({ key: 'email', label: 'Email delivery', status: cfg.mail.driver === 'log' ? 'warn' : failed || stuck ? 'warn' : lastSent ? 'ok' : 'unknown',
    detail: `${cfg.mail.driver === 'log' ? 'Local mode: emails are saved to files, not sent. ' : `Method: ${cfg.mail.driver}. `}${queued} queued, ${failed} failed.${stuck ? ' The oldest queued email is more than an hour old.' : ''}${!lastSent ? ' No successful delivery recorded yet.' : ''}`, last_ok: lastSent ?? null });
  try {
    const t = Date.now();
    const PDFDocument = require('pdfkit');
    await new Promise<void>((resolve, reject) => { const d = new PDFDocument({ size: 'A4' }); d.on('data', () => {}); d.on('end', resolve); d.on('error', reject); d.text('health check'); d.end(); });
    checks.push({ key: 'reports', label: 'PDF report generation', status: 'ok', detail: 'A test PDF was generated in memory.', latency_ms: Date.now() - t, last_ok: (await db.val('SELECT MAX(created_at) FROM report_tokens')) ?? null });
  } catch { checks.push({ key: 'reports', label: 'PDF report generation', status: 'fail', detail: 'The PDF library failed to generate a test document.' }); }
  const lastRetention = await db.val("SELECT MAX(created_at) FROM audit_log WHERE action = 'retention.run'");
  checks.push({ key: 'jobs', label: 'Background jobs (cron)', status: lastRetention && Date.now() - ts(String(lastRetention)).getTime() < 48 * 3600_000 ? 'ok' : 'warn',
    detail: lastRetention ? 'Daily retention task has run recently.' : 'No retention run recorded. Check that the cron job is configured.', last_ok: lastRetention ?? null });
  checks.push({ key: 'scheduling', label: 'Scheduled publishing', status: 'not_available', detail: 'Not part of this application. Content is published when you save it.' });
  checks.push({ key: 'backups', label: 'Backups', status: 'unknown', detail: 'Not monitored by this application. Use cPanel → Backup to confirm.' });
  const failures = {
    emails_failed_7d: Number(await db.val("SELECT COUNT(*) FROM email_outbox WHERE status = 'failed' AND created_at >= ?", [now(-7 * 86400)])),
    denied_7d: Number(await db.val("SELECT COUNT(*) FROM audit_log WHERE action = 'auth.denied' AND created_at >= ?", [now(-7 * 86400)])),
  };
  const info = { node: process.version, mode: cfg.env, started_at: iso(new Date(Date.now() - process.uptime() * 1000)), records: {
    leads: Number(await db.val('SELECT COUNT(*) FROM leads')), assessments: Number(await db.val('SELECT COUNT(*) FROM assessments')), users: Number(await db.val('SELECT COUNT(*) FROM users')),
    content_docs: Number(await db.val('SELECT COUNT(*) FROM content_docs')), audit_entries: Number(await db.val('SELECT COUNT(*) FROM audit_log')) } };
  return { checked_at, checks, failures, info };
}));

/* --------------------------------- Redirects --------------------------------- */
commandRouter.get('/redirects', requireCap('view'), h(async () => ({ redirects: await Redirects.all() })));
commandRouter.post('/redirects', requireCap('content'), h(async (req) => {
  const r = validateRedirect(req.body?.from_path, req.body?.to_path, req.body?.status_code);
  if (await db.val('SELECT id FROM redirects WHERE from_path = ?', [r.from_path])) throw new ApiError('A redirect for this address already exists.', 'conflict', 409, { field: 'from_path' });
  await Redirects.checkChain(r.from_path, r.to_path);
  const id = await db.insert('redirects', { ...r, created_by: uid(req) });
  Redirects.invalidate();
  await audit(uid(req), 'redirect.create', 'redirect', id, r);
  return { id };
}));
commandRouter.put('/redirects/:id', requireCap('content'), h(async (req) => {
  const id = int(req.params.id);
  if (!(await db.val('SELECT id FROM redirects WHERE id = ?', [id]))) throw new ApiError('Not found', 'not_found', 404);
  const r = validateRedirect(req.body?.from_path, req.body?.to_path, req.body?.status_code);
  if (await db.val('SELECT id FROM redirects WHERE from_path = ? AND id <> ?', [r.from_path, id])) throw new ApiError('A redirect for this address already exists.', 'conflict', 409, { field: 'from_path' });
  await Redirects.checkChain(r.from_path, r.to_path, id);
  await db.update('redirects', r, 'id = ?', [id]);
  Redirects.invalidate();
  await audit(uid(req), 'redirect.update', 'redirect', id, r);
  return { ok: true };
}));
commandRouter.delete('/redirects/:id', requireCap('content'), h(async (req) => {
  const id = int(req.params.id);
  const n = (await db.run('DELETE FROM redirects WHERE id = ?', [id])).affectedRows;
  if (!n) throw new ApiError('Not found', 'not_found', 404);
  Redirects.invalidate();
  await audit(uid(req), 'redirect.delete', 'redirect', id);
  return { ok: true };
}));

/* ----------------------- All website content (for SEO, translation and status views) ----------------------- */
commandRouter.get('/content-bulk', requireCap('view'), h(async () => {
  const rows = await db.all('SELECT d.doc_key, d.data, d.updated_at, u.name updated_by_name FROM content_docs d LEFT JOIN users u ON u.id = d.updated_by ORDER BY d.doc_key');
  return { docs: rows.map((r) => ({ doc_key: r.doc_key, updated_at: r.updated_at, updated_by_name: r.updated_by_name, data: JSON.parse(r.data) })) };
}));
