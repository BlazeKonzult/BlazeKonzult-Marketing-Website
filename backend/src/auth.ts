import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { loadConfig } from './config';
import { db, now } from './db';
import { ApiError } from './http';
import { Crypto, Password, RateLimit, RecoveryCodes, Token, Totp } from './security';

export type Role = 'owner' | 'admin' | 'editor' | 'sales' | 'viewer';
export type User = { id: number; email: string; name: string; role: Role };

/** Capability → roles allowed. Enforced server-side on every admin route. */
export const CAPS: Record<string, Role[]> = {
  view: ['owner', 'admin', 'editor', 'sales', 'viewer'],
  content: ['owner', 'admin', 'editor'],
  publish: ['owner', 'admin', 'editor'],
  assessments: ['owner', 'admin', 'sales'],
  leads: ['owner', 'admin', 'sales'],
  reports: ['owner', 'admin', 'sales'],
  export: ['owner', 'admin'],
  delete: ['owner', 'admin'],
  settings: ['owner', 'admin'],
  audit: ['owner', 'admin'],
  users: ['owner'],
};
export const ROLES: Role[] = ['owner', 'admin', 'editor', 'sales', 'viewer'];

const COOKIE = 'bk_admin';
export const SESSION_HOURS = 8;
export const IDLE_MINUTES = 120;

export const can = (u: User | null | undefined, cap: string) => !!u && (CAPS[cap] ?? []).includes(u.role);
export const capsFor = (role: Role) => Object.keys(CAPS).filter((c) => CAPS[c].includes(role));

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function setCookie(res: Response, value: string, maxAgeSec: number): void {
  const secure = loadConfig().env === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`);
}

export async function audit(userId: number | null, action: string, entity: string | null = null, entityId: string | number | null = null, meta: Record<string, unknown> = {}): Promise<void> {
  try {
    await db.insert('audit_log', { user_id: userId, action, entity, entity_id: entityId === null ? null : String(entityId), meta: Object.keys(meta).length ? JSON.stringify(meta) : null });
  } catch (e) { console.error('[audit]', (e as Error).message); }
}

const DUMMY = Password.hash('timing-equaliser-not-a-real-password');

const DEVICE_COOKIE = 'bk_td';
const DEVICE_DAYS = 30;
const CHALLENGE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;

function setNamedCookie(res: Response, name: string, value: string, maxAgeSec: number, path = '/api'): void {
  const secure = loadConfig().env === 'production' ? '; Secure' : '';
  res.append('Set-Cookie', `${name}=${value}; Path=${path}; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`);
}
const lockedOut = (u: any) => u.locked_until && new Date(u.locked_until + 'Z').getTime() > Date.now();
const locked = () => new ApiError('Account temporarily locked. Try again later.', 'locked', 423);

/** Count a failed password or code against the account; 5 failures lock it for 15 minutes. */
async function recordFailure(u: any, action: string) {
  const fails = Number(u.failed_logins) + 1;
  await db.update('users', { failed_logins: fails, locked_until: fails >= 5 ? now(900) : null }, 'id = ?', [u.id]);
  await audit(u.id, action, 'user', u.id);
  return fails >= 5;
}

/** Short description of the browser for alerts and the trusted-device list. */
function deviceLabel(req: Request): string {
  const ua = String(req.get('user-agent') ?? '');
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'unknown system';
  return `${browser} on ${os}`;
}

async function trustedDevice(req: Request, userId: number): Promise<string | null> {
  const t = readCookie(req, DEVICE_COOKIE);
  if (!t || !Token.valid(t)) return null;
  const d = await db.one('SELECT id, expires_at FROM trusted_devices WHERE id = ? AND user_id = ?', [Token.hash(t), userId]);
  if (!d || new Date(d.expires_at + 'Z').getTime() < Date.now()) return null;
  await db.run('UPDATE trusted_devices SET last_used_at = ? WHERE id = ?', [now(), d.id]);
  return d.id;
}

/** Second step done (or skipped on a trusted device): create the session and send the sign-in alert. */
async function finishLogin(req: Request, res: Response, u: any, how: string) {
  await db.update('users', { failed_logins: 0, locked_until: null, last_login_at: now() }, 'id = ?', [u.id]);
  const [token, hash] = Token.generate();
  const csrf = crypto.randomBytes(32).toString('hex');
  await db.insert('admin_sessions', { id: hash, user_id: u.id, csrf, expires_at: now(SESSION_HOURS * 3600), label: deviceLabel(req).slice(0, 190) });
  setCookie(res, token, SESSION_HOURS * 3600);
  await audit(u.id, 'auth.login', 'user', u.id, { how, device: deviceLabel(req) });
  try { await loginAlert(u, req, how); } catch (e) { console.error('[auth] alert failed', (e as Error).message); }
  return { user: Auth.publicUser(u as User), csrf };
}

async function loginAlert(u: any, req: Request, how: string) {
  const { Mailer, renderEmail } = await import('./mailer');
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Amsterdam', dateStyle: 'long', timeStyle: 'short' });
  const via = how === 'trusted_device' ? 'a trusted device (no code needed)' : how === 'recovery_code' ? 'a backup code' : 'your authenticator app';
  const [html, text] = renderEmail('en', 'New sign-in to the BlazeKonzult admin', [
    `Hi ${u.name}, your account (${u.email}) was just signed in to.`,
    `Time: ${when} (Amsterdam). IP address: ${req.ip ?? 'unknown'}. Device: ${deviceLabel(req)}. Verified with ${via}.`,
    'If this was you, there is nothing to do. If it was not, change your password straight away under Settings → My account, sign out other devices, and tell the account owner.',
  ], null, [], false);
  await Mailer.queue('login_alert', u.email, 'New sign-in to the BlazeKonzult admin', html, text, null);
}

async function challengeFor(token: unknown) {
  const t = String(token ?? '');
  const bad = () => new ApiError('Your sign-in session expired. Please sign in again.', 'challenge_expired', 401);
  if (!Token.valid(t)) throw bad();
  const c = await db.one('SELECT * FROM mfa_challenges WHERE id = ?', [Token.hash(t)]);
  if (!c || new Date(c.expires_at + 'Z').getTime() < Date.now() || c.attempts >= MAX_CODE_ATTEMPTS) throw bad();
  const u = await db.one('SELECT * FROM users WHERE id = ?', [c.user_id]);
  if (!u || !u.active) throw bad();
  if (lockedOut(u)) throw locked();
  return { c, u };
}

export const Auth = {
  /** Step 1: email + password. Returns a short-lived challenge for the authenticator code (or signs in on a trusted device). */
  async login(req: Request, res: Response, email: string, password: string) {
    await RateLimit.hit(req, 'login', 10, 900);
    const u = await db.one('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const fail = () => new ApiError('Invalid email or password.', 'invalid_credentials', 401);
    if (!u || !u.active) { Password.verify(password, DUMMY); throw fail(); }
    if (lockedOut(u)) throw locked();
    if (!Password.verify(password, u.password_hash)) { await recordFailure(u, 'auth.login_failed'); throw fail(); }
    const mfa = await db.one('SELECT user_id FROM user_mfa WHERE user_id = ?', [u.id]);
    if (mfa && (await trustedDevice(req, u.id))) return finishLogin(req, res, u, 'trusted_device');
    const [token, hash] = Token.generate();
    await db.run('DELETE FROM mfa_challenges WHERE user_id = ? OR expires_at < ?', [u.id, now()]);
    await db.insert('mfa_challenges', { id: hash, user_id: u.id, purpose: mfa ? 'verify' : 'setup', expires_at: now(CHALLENGE_MINUTES * 60) });
    await audit(u.id, 'auth.password_ok', 'user', u.id);
    return { mfa: mfa ? 'verify' : 'setup', challenge: token, email: u.email };
  },

  /** First sign-in: create the authenticator secret and QR code (kept on the challenge until confirmed). */
  async setup(req: Request, token: unknown) {
    await RateLimit.hit(req, 'mfa', 20, 900);
    const { c, u } = await challengeFor(token);
    if (c.purpose !== 'setup') throw new ApiError('Two-factor sign-in is already set up.', 'conflict', 409);
    let secret = c.secret_enc ? Crypto.decrypt(c.secret_enc)! : null;
    if (!secret) { secret = Totp.newSecret(); await db.update('mfa_challenges', { secret_enc: Crypto.encrypt(secret) }, 'id = ?', [c.id]); }
    const uri = Totp.uri(secret, u.email);
    const QR = await import('qrcode');
    const qr = await QR.toString(uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0B1726', light: '#FFFFFF' } });
    return { secret: secret.replace(/(.{4})/g, '$1 ').trim(), uri, qr_svg: qr };
  },

  /** Step 2: authenticator code (or a backup code). Optionally remembers this browser for 30 days. */
  async verify(req: Request, res: Response, body: any) {
    await RateLimit.hit(req, 'mfa', 20, 900);
    const { c, u } = await challengeFor(body?.challenge);
    const code = String(body?.code ?? '').replace(/\s/g, '');
    const recovery = String(body?.recovery_code ?? '').trim();
    const wrong = async () => {
      await db.run('UPDATE mfa_challenges SET attempts = attempts + 1 WHERE id = ?', [c.id]);
      const nowLocked = await recordFailure(u, 'auth.code_failed');
      if (nowLocked) { await db.run('DELETE FROM mfa_challenges WHERE id = ?', [c.id]); throw locked(); }
      return new ApiError('That code is not correct. Check the time on your phone and try again.', 'invalid_code', 401);
    };
    let how = 'authenticator';
    let recoveryCodes: string[] | null = null;

    if (c.purpose === 'setup') {
      if (!c.secret_enc) throw new ApiError('Scan the QR code first.', 'validation', 422);
      const secret = Crypto.decrypt(c.secret_enc)!;
      const step = Totp.verify(secret, code);
      if (step === null) throw await wrong();
      const rc = RecoveryCodes.generate();
      await db.run('INSERT INTO user_mfa (user_id, secret_enc, enabled_at, last_step, recovery) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE secret_enc = VALUES(secret_enc), enabled_at = VALUES(enabled_at), last_step = VALUES(last_step), recovery = VALUES(recovery)',
        [u.id, Crypto.encrypt(secret), now(), step, JSON.stringify(rc.hashes)]);
      recoveryCodes = rc.codes;
      how = 'setup';
      await audit(u.id, 'auth.mfa_enabled', 'user', u.id);
    } else {
      const m = await db.one('SELECT * FROM user_mfa WHERE user_id = ?', [u.id]);
      if (!m) throw new ApiError('Your sign-in session expired. Please sign in again.', 'challenge_expired', 401);
      if (recovery) {
        const hashes: string[] = JSON.parse(m.recovery);
        const h = RecoveryCodes.hash(recovery);
        if (!hashes.includes(h)) throw await wrong();
        await db.update('user_mfa', { recovery: JSON.stringify(hashes.filter((x) => x !== h)) }, 'user_id = ?', [u.id]);
        how = 'recovery_code';
        await audit(u.id, 'auth.recovery_code_used', 'user', u.id, { remaining: hashes.length - 1 });
      } else {
        const step = Totp.verify(Crypto.decrypt(m.secret_enc)!, code, Number(m.last_step));
        if (step === null) throw await wrong();
        await db.update('user_mfa', { last_step: step }, 'user_id = ?', [u.id]);
      }
    }
    await db.run('DELETE FROM mfa_challenges WHERE id = ?', [c.id]);
    if (body?.trust_device === true || body?.trust_device === 'true') {
      const [dt, dh] = Token.generate();
      await db.insert('trusted_devices', { id: dh, user_id: u.id, label: deviceLabel(req), expires_at: now(DEVICE_DAYS * 86400) });
      setNamedCookie(res, DEVICE_COOKIE, dt, DEVICE_DAYS * 86400, '/api/admin');
    }
    const out: any = await finishLogin(req, res, u, how);
    if (recoveryCodes) out.recovery_codes = recoveryCodes;
    if (how === 'recovery_code') out.recovery_remaining = JSON.parse((await db.one('SELECT recovery FROM user_mfa WHERE user_id = ?', [u.id]))!.recovery).length;
    return out;
  },

  /** Two-factor status for "My account". */
  async mfaStatus(req: Request, userId: number) {
    const m = await db.one('SELECT enabled_at, recovery FROM user_mfa WHERE user_id = ?', [userId]);
    const current = readCookie(req, DEVICE_COOKIE);
    const devices = await db.all('SELECT id, label, created_at, last_used_at, expires_at FROM trusted_devices WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC', [userId, now()]);
    return {
      enabled_at: m?.enabled_at ?? null, recovery_remaining: m ? JSON.parse(m.recovery).length : 0,
      devices: devices.map((d) => ({ id: d.id.slice(0, 12), label: d.label, created_at: d.created_at, last_used_at: d.last_used_at, expires_at: d.expires_at, current: !!current && Token.valid(current) && Token.hash(current) === d.id })),
    };
  },

  /** New set of backup codes (old ones stop working). Requires a current authenticator code. */
  async regenerateRecovery(userId: number, code: string) {
    const m = await db.one('SELECT * FROM user_mfa WHERE user_id = ?', [userId]);
    if (!m) throw new ApiError('Two-factor sign-in is not set up.', 'conflict', 409);
    const step = Totp.verify(Crypto.decrypt(m.secret_enc)!, code, Number(m.last_step));
    if (step === null) throw new ApiError('That code is not correct.', 'invalid_code', 422);
    const rc = RecoveryCodes.generate();
    await db.update('user_mfa', { recovery: JSON.stringify(rc.hashes), last_step: step }, 'user_id = ?', [userId]);
    await audit(userId, 'auth.recovery_regenerated', 'user', userId);
    return { recovery_codes: rc.codes };
  },

  async forgetDevices(res: Response, userId: number, idPrefix?: string) {
    if (idPrefix) await db.run('DELETE FROM trusted_devices WHERE user_id = ? AND id LIKE ?', [userId, `${idPrefix.replace(/[^a-f0-9]/g, '').slice(0, 12)}%`]);
    else { await db.run('DELETE FROM trusted_devices WHERE user_id = ?', [userId]); setNamedCookie(res, DEVICE_COOKIE, '', 0, '/api/admin'); }
    await audit(userId, 'auth.devices_forgotten', 'user', userId);
  },

  /** Owner/server reset: the user sets up two-factor again at next sign-in. */
  async resetMfa(userId: number, by: number | null) {
    await db.run('DELETE FROM user_mfa WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM trusted_devices WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM mfa_challenges WHERE user_id = ?', [userId]);
    await db.run('DELETE FROM admin_sessions WHERE user_id = ?', [userId]);
    await audit(by, 'auth.mfa_reset', 'user', userId);
  },

  async logout(req: Request, res: Response) {
    const t = readCookie(req, COOKIE);
    if (t && Token.valid(t)) await db.run('DELETE FROM admin_sessions WHERE id = ?', [Token.hash(t)]);
    setCookie(res, '', 0);
  },

  /** Resolve the session from the cookie; enforces absolute and idle expiry. */
  async session(req: Request): Promise<{ user: User; csrf: string; sid: string } | null> {
    const t = readCookie(req, COOKIE);
    if (!t || !Token.valid(t)) return null;
    const sid = Token.hash(t);
    const s = await db.one(`SELECT s.csrf, s.last_seen_at, s.expires_at, u.id, u.email, u.name, u.role, u.active
                            FROM admin_sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`, [sid]);
    if (!s || !s.active) return null;
    const idle = Date.now() - new Date(s.last_seen_at + 'Z').getTime() > IDLE_MINUTES * 60_000;
    if (idle || new Date(s.expires_at + 'Z').getTime() < Date.now()) { await db.run('DELETE FROM admin_sessions WHERE id = ?', [sid]); return null; }
    await db.run('UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?', [now(), sid]);
    return { user: { id: s.id, email: s.email, name: s.name, role: s.role }, csrf: s.csrf, sid };
  },

  publicUser(u: User) { return { id: u.id, email: u.email, name: u.name, role: u.role, caps: capsFor(u.role) }; },
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express { interface Request { user?: User; sid?: string; } }
}

/** Middleware: authenticated + capability + CSRF (for state-changing methods). */
export function requireCap(cap: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const s = await Auth.session(req);
      if (!s) throw new ApiError('Please sign in.', 'unauthenticated', 401);
      if (!can(s.user, cap)) {
        await audit(s.user.id, 'auth.denied', null, null, { cap, path: req.path });
        throw new ApiError('You do not have permission for this action.', 'forbidden', 403);
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        const sent = req.get('x-csrf-token') ?? '';
        if (sent.length !== s.csrf.length || !crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(s.csrf))) {
          throw new ApiError('Your session has expired. Please reload the page.', 'csrf', 419);
        }
      }
      req.user = s.user;
      req.sid = s.sid;
      next();
    } catch (e) { next(e); }
  };
}
