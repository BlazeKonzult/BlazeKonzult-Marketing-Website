import crypto from 'crypto';
import type { Request } from 'express';
import { loadConfig } from './config';
import { db } from './db';
import { ApiError } from './http';

/** AES-256-GCM encryption at rest. Format: v1:<base64(iv | tag | ciphertext)> */
export const Crypto = {
  encrypt(plain: string | null | undefined): string | null {
    if (plain === null || plain === undefined) return null;
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', loadConfig().appKey, iv);
    const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return 'v1:' + Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64');
  },
  decrypt(stored: string | null | undefined): string | null {
    if (!stored) return null;
    if (!stored.startsWith('v1:')) throw new Error('Unknown ciphertext format');
    const raw = Buffer.from(stored.slice(3), 'base64');
    const d = crypto.createDecipheriv('aes-256-gcm', loadConfig().appKey, raw.subarray(0, 12));
    d.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8');
  },
  encryptJson(v: unknown): string { return Crypto.encrypt(JSON.stringify(v))!; },
  decryptJson<T = any>(v: string | null | undefined): T | null { const p = Crypto.decrypt(v); return p === null ? null : JSON.parse(p); },
  /** Keyed blind index (HMAC-SHA256) for lookups without storing plaintext. */
  blindIndex(value: string): string {
    return crypto.createHmac('sha256', loadConfig().indexKey).update(value.trim().toLowerCase()).digest('hex');
  },
};

const b64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Unguessable tokens; only SHA-256 hashes are stored. */
export const Token = {
  generate(): [string, string] { const t = b64url(crypto.randomBytes(32)); return [t, Token.hash(t)]; },
  hash(t: string): string { return crypto.createHash('sha256').update(t).digest('hex'); },
  valid(t: unknown): t is string { return typeof t === 'string' && /^[A-Za-z0-9_-]{43}$/.test(t); },
  ref(): string {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(crypto.randomBytes(12), (b) => a[b % a.length]).join('');
  },
  uuidValid(v: unknown): v is string { return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v); },
  /** Deterministic result token from the client's random submission key + server secret. */
  resultToken(idempotencyKey: string): string {
    return b64url(crypto.createHmac('sha256', loadConfig().indexKey).update('result:' + idempotencyKey.toLowerCase()).digest());
  },
};

/** Keyed hash of the client IP; raw IPs are never stored. */
export function clientKey(req: Request): string { return Crypto.blindIndex('ip:' + (req.ip || '0.0.0.0')); }

/** Fixed-window rate limiter backed by MySQL (works across multiple Node processes). */
export const RateLimit = {
  async hit(req: Request | null, name: string, limit: number, windowSeconds: number, keyOverride?: string): Promise<void> {
    const k = keyOverride ?? (req ? clientKey(req) : 'global');
    const bucket = crypto.createHash('sha256').update(`${name}|${k}`).digest('hex');
    const win = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
    await db.run('INSERT INTO rate_limits (bucket, window_start, hits) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE hits = hits + 1', [bucket, win]);
    const hits = Number(await db.val('SELECT hits FROM rate_limits WHERE bucket = ? AND window_start = ?', [bucket, win]));
    if (hits > limit) throw new ApiError('Too many requests. Please wait a moment and try again.', 'rate_limited', 429);
  },
  async purge(): Promise<number> {
    return (await db.run('DELETE FROM rate_limits WHERE window_start < ?', [Math.floor(Date.now() / 1000) - 86400])).affectedRows;
  },
};

/** Privacy-friendly bot protection: honeypot field + minimum completion time. No third-party CAPTCHA. */
export function botCheck(body: any, minSeconds: number): void {
  if (body?.website) throw new ApiError('Submission rejected', 'bot', 400);
  const elapsed = Number(body?.elapsed_ms ?? 0);
  if (!Number.isFinite(elapsed) || elapsed < minSeconds * 1000) throw new ApiError('Please take a moment to complete the form.', 'too_fast', 400);
}

/** scrypt password hashing (built into Node, no native modules). Format: scrypt$N$r$p$salt$hash */
export const Password = {
  hash(pw: string): string {
    const salt = crypto.randomBytes(16);
    const N = 16384, r = 8, p = 1;
    const dk = crypto.scryptSync(pw, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
    return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${dk.toString('base64')}`;
  },
  verify(pw: string, stored: string): boolean {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const [, N, r, p, salt, hash] = parts;
    const expected = Buffer.from(hash, 'base64');
    const dk = crypto.scryptSync(pw, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
    return crypto.timingSafeEqual(dk, expected);
  },
  validate(pw: unknown): void {
    if (typeof pw !== 'string' || pw.length < 12) throw new ApiError('Password must be at least 12 characters.', 'validation', 422);
    if (pw.length > 200) throw new ApiError('Password is too long.', 'validation', 422);
  },
};

/* ------------------------- Time-based one-time passwords (RFC 6238) ------------------------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const Totp = {
  STEP: 30,
  newSecret(): string {
    const bytes = crypto.randomBytes(20);
    let bits = '', out = '';
    for (const b of bytes) bits += b.toString(2).padStart(8, '0');
    for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
    return out;
  },
  decode(secret: string): Buffer {
    const clean = secret.replace(/[\s=-]/g, '').toUpperCase();
    let bits = '';
    for (const ch of clean) { const v = B32.indexOf(ch); if (v < 0) throw new Error('Invalid secret'); bits += v.toString(2).padStart(5, '0'); }
    const out: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
    return Buffer.from(out);
  },
  currentStep: (at = Date.now()) => Math.floor(at / 1000 / Totp.STEP),
  code(secret: string, step: number): string {
    const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
    const h = crypto.createHmac('sha1', Totp.decode(secret)).update(msg).digest();
    const o = h[h.length - 1] & 0xf;
    const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
    return String(n % 1_000_000).padStart(6, '0');
  },
  /** Returns the matched time step (±1 step drift allowed), or null. Steps at or before lastStep are refused (no replay). */
  verify(secret: string, code: string, lastStep = 0, at = Date.now()): number | null {
    const c = String(code ?? '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(c)) return null;
    const now = Totp.currentStep(at);
    for (const s of [now - 1, now, now + 1]) {
      if (s <= lastStep) continue;
      const expected = Totp.code(secret, s);
      if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(c))) return s;
    }
    return null;
  },
  uri(secret: string, account: string, issuer = 'BlazeKonzult'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  },
};

/** One-time backup codes (format xxxx-xxxx), stored only as hashes. */
export const RecoveryCodes = {
  generate(n = 10): { codes: string[]; hashes: string[] } {
    const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
    const codes = Array.from({ length: n }, () => {
      const b = crypto.randomBytes(8);
      const s = [...b].map((x) => alphabet[x % alphabet.length]).join('');
      return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
    });
    return { codes, hashes: codes.map(RecoveryCodes.hash) };
  },
  hash: (c: string) => crypto.createHash('sha256').update(String(c).trim().toLowerCase().replace(/[^a-z0-9]/g, '')).digest('hex'),
};
