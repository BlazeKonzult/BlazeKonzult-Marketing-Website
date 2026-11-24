import { db, now } from './db';
import { Settings } from './settings';
import { Leads } from './leads';
import { RateLimit } from './security';
import { audit } from './auth';

type F = { from?: string; to?: string; template?: string; industry?: string; company_size?: string };
const d = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function where(f: F, alias: string, col: string, profile = true): [string, unknown[]] {
  const w = ['1=1']; const p: unknown[] = [];
  if (d(f.from)) { w.push(`${alias}.${col} >= ?`); p.push(`${f.from} 00:00:00`); }
  if (d(f.to)) { w.push(`${alias}.${col} <= ?`); p.push(`${f.to} 23:59:59`); }
  if (f.template) { w.push(`${alias}.template_id = (SELECT id FROM templates WHERE slug = ?)`); p.push(String(f.template)); }
  if (profile && f.industry) { w.push(`${alias}.industry = ?`); p.push(String(f.industry)); }
  if (profile && f.company_size) { w.push(`${alias}.company_size = ?`); p.push(String(f.company_size)); }
  return [w.join(' AND '), p];
}

const r1 = (v: unknown) => (v === null || v === undefined ? null : Math.round(Number(v) * 10) / 10);

/** Aggregated analytics from real database records only. */
export async function analytics(f: F) {
  const [ws, ps] = where(f, 's', 'started_at', false);
  const [wa, pa] = where(f, 'a', 'created_at');
  const n = async (sql: string, p: unknown[]) => Number(await db.val(sql, p));
  const starts = await n(`SELECT COUNT(*) FROM assessment_sessions s WHERE ${ws}`, ps);
  const sessDone = await n(`SELECT COUNT(*) FROM assessment_sessions s WHERE ${ws} AND s.completed_at IS NOT NULL`, ps);
  const completed = await n(`SELECT COUNT(*) FROM assessments a WHERE ${wa}`, pa);
  const leads = await n(`SELECT COUNT(*) FROM leads l JOIN assessments a ON a.id = l.assessment_id WHERE ${wa}`, pa);
  const consult = await n(`SELECT COUNT(*) FROM leads l JOIN assessments a ON a.id = l.assessment_id WHERE ${wa} AND l.wants_consultation = 1`, pa);
  const converted = await n(`SELECT COUNT(*) FROM leads l JOIN assessments a ON a.id = l.assessment_id WHERE ${wa} AND l.status = 'converted'`, pa);
  const avg = await db.val(`SELECT AVG(a.overall_score) FROM assessments a WHERE ${wa}`, pa);
  const byType = await db.all(`SELECT t.slug, COUNT(*) n, AVG(a.overall_score) avg FROM assessments a JOIN templates t ON t.id = a.template_id WHERE ${wa} GROUP BY t.slug ORDER BY n DESC`, pa);
  const byIndustry = await db.all(`SELECT COALESCE(a.industry,'unknown') k, COUNT(*) n FROM assessments a WHERE ${wa} GROUP BY k ORDER BY n DESC`, pa);
  const bySize = await db.all(`SELECT COALESCE(a.company_size,'unknown') k, COUNT(*) n FROM assessments a WHERE ${wa} GROUP BY k ORDER BY n DESC`, pa);
  const byClass = await db.all(`SELECT COALESCE(a.classification,'none') k, COUNT(*) n FROM assessments a WHERE ${wa} GROUP BY k`, pa);
  const sum: Record<string, number> = {}, cnt: Record<string, number> = {}, gaps: Record<string, number> = {};
  for (const r of await db.all(`SELECT a.category_scores, a.gap_codes FROM assessments a WHERE ${wa}`, pa)) {
    for (const [k, v] of Object.entries(JSON.parse(r.category_scores ?? '{}') as Record<string, number | null>)) if (v !== null) { sum[k] = (sum[k] ?? 0) + v; cnt[k] = (cnt[k] ?? 0) + 1; }
    for (const g of String(r.gap_codes ?? '').split(',').filter(Boolean)) gaps[g] = (gaps[g] ?? 0) + 1;
  }
  const trend = await db.all(`SELECT DATE_FORMAT(a.created_at, '%Y-%m') month, COUNT(*) n, AVG(a.overall_score) avg FROM assessments a WHERE ${wa} GROUP BY month ORDER BY month`, pa);
  const track = await Settings.get('track_steps');
  const abandon = track ? await db.all(`SELECT s.max_step step, COUNT(*) n FROM assessment_sessions s WHERE ${ws} AND s.completed_at IS NULL GROUP BY s.max_step ORDER BY s.max_step`, ps) : [];
  const pct = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : null);
  return {
    starts, completed, completion_rate: pct(sessDone, starts), leads, lead_rate: pct(leads, completed), consultations: consult, converted,
    conversion_rate: pct(converted, leads), avg_score: r1(avg),
    by_type: byType.map((r) => ({ slug: r.slug, n: Number(r.n), avg: r1(r.avg) })),
    by_industry: byIndustry.map((r) => ({ key: r.k, n: Number(r.n) })), by_size: bySize.map((r) => ({ key: r.k, n: Number(r.n) })),
    by_classification: byClass.map((r) => ({ key: r.k, n: Number(r.n) })),
    categories: Object.keys(sum).map((k) => ({ key: k, avg: r1(sum[k] / cnt[k]), n: cnt[k] })).sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0)),
    gaps: Object.entries(gaps).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, c]) => ({ code, n: c, pct: pct(c, completed) })),
    trend: trend.map((r) => ({ month: r.month, n: Number(r.n), avg: r1(r.avg) })),
    abandonment: abandon.map((r) => ({ step: Number(r.step), n: Number(r.n) })), step_tracking: track,
  };
}

/** Configurable data retention (run daily by cron). */
export async function runRetention(userId: number | null = null) {
  const cut = async (k: 'retention_days_leads' | 'retention_days_anonymous' | 'retention_days_sessions' | 'retention_days_audit') => now(-86400 * Math.max(1, Number(await Settings.get(k))));
  const out: Record<string, number> = {};
  const old = await db.all<{ id: number }>("SELECT id FROM leads WHERE created_at < ? AND status <> 'converted'", [await cut('retention_days_leads')]);
  for (const l of old) await Leads.erase(l.id);
  out.leads = old.length;
  const anon = await db.all<{ id: number }>('SELECT a.id FROM assessments a LEFT JOIN leads l ON l.assessment_id = a.id WHERE l.id IS NULL AND a.created_at < ?', [await cut('retention_days_anonymous')]);
  for (const a of anon) { await db.run('DELETE FROM report_tokens WHERE assessment_id = ?', [a.id]); await db.run('DELETE FROM assessments WHERE id = ?', [a.id]); }
  out.anonymous_assessments = anon.length;
  out.sessions = (await db.run('DELETE FROM assessment_sessions WHERE started_at < ?', [await cut('retention_days_sessions')])).affectedRows;
  out.expired_report_links = (await db.run('DELETE FROM report_tokens WHERE expires_at < ?', [now(-30 * 86400)])).affectedRows;
  out.emails = (await db.run("DELETE FROM email_outbox WHERE (status = 'sent' AND sent_at < ?) OR (status = 'failed' AND created_at < ?)", [now(-30 * 86400), now(-90 * 86400)])).affectedRows;
  out.audit = (await db.run('DELETE FROM audit_log WHERE created_at < ?', [await cut('retention_days_audit')])).affectedRows;
  out.admin_sessions = (await db.run('DELETE FROM admin_sessions WHERE expires_at < ?', [now()])).affectedRows;
  out.trusted_devices = (await db.run('DELETE FROM trusted_devices WHERE expires_at < ?', [now()])).affectedRows;
  await db.run('DELETE FROM mfa_challenges WHERE expires_at < ?', [now()]);
  out.rate_limits = await RateLimit.purge();
  await audit(userId, 'retention.run', null, null, out);
  return out;
}
