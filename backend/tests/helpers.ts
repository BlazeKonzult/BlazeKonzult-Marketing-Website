/* Test harness: API-only app on an ephemeral port against the bk_test database. */
process.env.NODE_ENV = 'test';
process.env.DB_HOST ??= '127.0.0.1';
process.env.DB_NAME ??= 'bk_test';
process.env.DB_USER ??= 'bk';
process.env.DB_PASS ??= 'bkpass';
process.env.MAIL_DRIVER = 'log';
process.env.MAIL_LOG_DIR ??= '/tmp/bk-test-mail';
process.env.MEDIA_DIR ??= '/tmp/bk-test-media';
process.env.SITE_URL = 'http://localhost:3001';

import type { AddressInfo } from 'net';
import type { Server } from 'http';
import { createApp } from '../src/app';
import { db, migrate, closePool, now } from '../src/db';
import { Password, Totp, Crypto, Token } from '../src/security';
import { seed } from '../src/seed';

export { db, now, Crypto, Totp, Token };

let server: Server | null = null;
export let base = '';

export async function start(site?: (req: any, res: any) => void) {
  await migrate();
  const tables = ['user_prefs', 'redirects', 'audit_log', 'lead_notes', 'report_tokens', 'email_outbox', 'leads', 'assessments', 'assessment_sessions', 'admin_sessions', 'mfa_challenges', 'trusted_devices', 'user_mfa', 'users', 'rate_limits', 'content_revisions', 'content_docs', 'media'];
  for (const t of tables) await db.run(`DELETE FROM \`${t}\``);
  if (!Number(await db.val('SELECT COUNT(*) FROM templates'))) await seed({ force: false, publish: true });
  const app = createApp(site ? { site } : {});
  server = app.listen(0);
  await new Promise((r) => server!.once('listening', r));
  base = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
}
export async function stop() { await new Promise((r) => server?.close(r)); await closePool(); }

export async function createUser(email: string, role: string, password = 'Correct-Horse-9!x') {
  const id = await db.insert('users', { email, name: email.split('@')[0], role, password_hash: Password.hash(password) });
  return { id, email, password };
}

/** Minimal cookie-jar client. */
export class Client {
  cookies = new Map<string, string>();
  csrf = '';
  async req(method: string, path: string, body?: unknown, headers: Record<string, string> = {}) {
    const res = await fetch(`${base}/api${path}`, {
      method, redirect: 'manual',
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(this.csrf && method !== 'GET' ? { 'x-csrf-token': this.csrf } : {}), cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) { const [kv] = c.split(';'); const [k, v] = kv.split('='); if (v) this.cookies.set(k, v); else this.cookies.delete(k); }
    const text = await res.text();
    let json: any = null; try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, text, headers: res.headers };
  }
  get(p: string) { return this.req('GET', p); }
  post(p: string, b: unknown = {}) { return this.req('POST', p, b); }
  put(p: string, b: unknown = {}) { return this.req('PUT', p, b); }
  patch(p: string, b: unknown = {}) { return this.req('PATCH', p, b); }
  del(p: string) { return this.req('DELETE', p); }
}

/** Full sign-in including first-time authenticator setup. Returns a signed-in client. */
export async function login(email: string, password: string) {
  const c = new Client();
  const r = await c.post('/admin/login', { email, password });
  if (r.status !== 200) throw new Error(`login failed ${r.status} ${r.text}`);
  if (r.json.user) { c.csrf = r.json.csrf; return c; }
  let code: string;
  if (r.json.mfa === 'setup') {
    const s = await c.post('/admin/login/setup', { challenge: r.json.challenge });
    code = Totp.code(s.json.secret.replace(/\s/g, ''), Totp.currentStep());
  } else {
    const uid = await db.val('SELECT id FROM users WHERE email = ?', [email]);
    const m = await db.one('SELECT secret_enc FROM user_mfa WHERE user_id = ?', [uid]);
    await db.run('UPDATE user_mfa SET last_step = 0 WHERE user_id = ?', [uid]);
    code = Totp.code(Crypto.decrypt(m!.secret_enc)!, Totp.currentStep());
  }
  const v = await c.post('/admin/login/verify', { challenge: r.json.challenge, code });
  if (v.status !== 200) throw new Error(`verify failed ${v.status} ${v.text}`);
  c.csrf = v.json.csrf;
  return c;
}

let refN = 0;
export const ref = () => `T${Date.now().toString(36).slice(-6)}${(refN++).toString(36).padStart(4, '0')}`.slice(0, 12).toUpperCase();

/** Insert records directly (fixtures for metrics). Dates are 'YYYY-MM-DD HH:MM:SS' UTC. */
export async function addSession(at: string, completed = false) {
  const t = await db.one("SELECT id FROM templates WHERE status = 'published' LIMIT 1");
  const v = await db.val('SELECT id FROM template_versions WHERE template_id = ? ORDER BY id DESC LIMIT 1', [t!.id]);
  return db.insert('assessment_sessions', { public_id: Token.generate()[1].slice(0, 32), template_id: t!.id, version_id: v, started_at: at, last_seen_at: at, completed_at: completed ? at : null });
}
export async function addAssessment(at: string, opts: { score?: number; services?: string[]; gaps?: string; cats?: Record<string, number> } = {}) {
  const t = await db.one("SELECT id FROM templates WHERE status = 'published' LIMIT 1");
  const v = await db.val('SELECT id FROM template_versions WHERE template_id = ? ORDER BY id DESC LIMIT 1', [t!.id]);
  return db.insert('assessments', {
    public_ref: ref(), token_hash: Token.generate()[1], idempotency_key: crypto.randomUUID(), template_id: t!.id, version_id: v,
    answers_enc: Crypto.encryptJson({}), result_enc: Crypto.encryptJson({ services: opts.services ?? [] }), overall_score: opts.score ?? 50, classification: 'established', coverage: 90,
    category_scores: JSON.stringify(opts.cats ?? { governance: 40 }), gap_codes: opts.gaps ?? '', result_expires_at: now(86400 * 30), created_at: at,
  });
}
export async function addLead(at: string, o: { source?: string; status?: string; consultation?: boolean; company?: string; name?: string; email?: string; followUp?: string | null } = {}) {
  const email = o.email ?? `${ref().toLowerCase()}@example.com`;
  return db.insert('leads', {
    public_ref: ref(), source: o.source ?? 'assessment', status: o.status ?? 'new', priority: 'medium', name_enc: Crypto.encrypt(o.name ?? 'Test Person'), company_enc: Crypto.encrypt(o.company ?? 'Acme BV'),
    email_enc: Crypto.encrypt(email), email_hash: Crypto.blindIndex(email), wants_consultation: o.consultation ? 1 : 0, created_at: at, updated_at: at, next_follow_up_at: o.followUp ?? null,
  });
}
