import type { NextFunction, Request, Response } from 'express';
import { db, now } from './db';
import { ApiError } from './http';

/** Admin-managed URL redirects, applied before the website renders a page. */
export type Redirect = { id: number; from_path: string; to_path: string; status_code: number };

let cache: Map<string, Redirect> | null = null;
let loadedAt = 0;
const TTL = 60_000;

/** Normalise a site path: leading slash, no query/hash, trailing slash (the site uses trailing slashes). */
export function normPath(p: string): string {
  let s = p.trim().split(/[?#]/)[0];
  if (!s.startsWith('/')) s = '/' + s;
  s = s.replace(/\/{2,}/g, '/');
  if (!s.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(s)) s += '/';
  return s.toLowerCase();
}

export function validateRedirect(fromRaw: unknown, toRaw: unknown, codeRaw: unknown) {
  const from = String(fromRaw ?? '').trim(); const to = String(toRaw ?? '').trim();
  if (!from.startsWith('/') || from.length > 300 || /\s|[<>"']/.test(from)) throw new ApiError('The old address must be a site path that starts with /.', 'validation', 422, { field: 'from_path' });
  if (/^\/(api|admin|media|_next)(\/|$)/i.test(from)) throw new ApiError('System addresses (/api, /admin, /media) cannot be redirected.', 'validation', 422, { field: 'from_path' });
  const external = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s<>"']*)?$/i.test(to);
  if (!(to.startsWith('/') && !to.startsWith('//')) && !external) throw new ApiError('The new address must be a site path (starting with /) or a full https:// address.', 'validation', 422, { field: 'to_path' });
  if (to.length > 500 || /\s|[<>"']/.test(to)) throw new ApiError('Invalid new address.', 'validation', 422, { field: 'to_path' });
  const code = Number(codeRaw ?? 301);
  if (![301, 302, 307, 308].includes(code)) throw new ApiError('Redirect type must be 301, 302, 307 or 308.', 'validation', 422, { field: 'status_code' });
  const f = normPath(from);
  if (!external && normPath(to) === f) throw new ApiError('A page cannot redirect to itself.', 'validation', 422, { field: 'to_path' });
  return { from_path: f, to_path: external ? to : to, status_code: code };
}

export const Redirects = {
  invalidate() { cache = null; },
  async all() {
    return db.all('SELECT r.*, u.name created_by_name FROM redirects r LEFT JOIN users u ON u.id = r.created_by ORDER BY r.from_path');
  },
  async load(): Promise<Map<string, Redirect>> {
    if (cache && Date.now() - loadedAt < TTL) return cache;
    const rows = await db.all<Redirect>('SELECT id, from_path, to_path, status_code FROM redirects');
    cache = new Map(rows.map((r) => [r.from_path, r]));
    loadedAt = Date.now();
    return cache;
  },
  /** Detect a loop (A→B→A) or a long chain before saving. */
  async checkChain(from: string, to: string, ignoreId?: number) {
    if (/^https:/.test(to)) return;
    const rows = await db.all<Redirect>('SELECT id, from_path, to_path, status_code FROM redirects');
    const map = new Map(rows.filter((r) => r.id !== ignoreId).map((r) => [r.from_path, r.to_path]));
    map.set(from, to);
    let cur = normPath(to); const seen = new Set([from]);
    for (let i = 0; i < 10; i++) {
      if (seen.has(cur)) throw new ApiError('This redirect would create a loop.', 'validation', 422, { field: 'to_path' });
      seen.add(cur);
      const next = map.get(cur); if (!next || /^https:/.test(next)) return;
      cur = normPath(next);
    }
    throw new ApiError('This redirect creates a chain of more than 10 steps.', 'validation', 422);
  },
};

/** Express middleware for website requests (not /api or /media). Fails open if the database is unavailable. */
export async function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['GET', 'HEAD'].includes(req.method) || /^\/(api|media|_next|admin)(\/|$)/.test(req.path)) return next();
  try {
    const map = await Redirects.load();
    if (!map.size) return next();
    const r = map.get(normPath(req.path));
    if (!r) return next();
    db.run('UPDATE redirects SET hits = hits + 1, last_hit_at = ? WHERE id = ?', [now(), r.id]).catch(() => {});
    const q = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    return res.redirect(r.status_code, r.to_path + (r.to_path.includes('?') ? '' : q));
  } catch { return next(); }
}
