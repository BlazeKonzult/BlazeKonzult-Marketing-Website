import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  constructor(message: string, public code = 'error', public status = 400, public details: Record<string, unknown> = {}) {
    super(message);
  }
}

/** Wrap async route handlers so rejections reach the error middleware. */
export const h = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { fn(req, res).then((body) => { if (!res.headersSent && body !== undefined) res.json(body); }).catch(next); };

/** Input helpers: trim, length-limit, reject non-strings. */
export function str(o: any, key: string, max = 200, required = false): string | null {
  const v = o?.[key];
  if (v === undefined || v === null || v === '') {
    if (required) throw new ApiError(`Missing field: ${key}`, 'validation', 422, { field: key });
    return null;
  }
  if (typeof v !== 'string' && typeof v !== 'number') throw new ApiError(`Invalid field: ${key}`, 'validation', 422, { field: key });
  const s = String(v).replace(/[\u0000\r]/g, '').trim();
  if (s.length > max) throw new ApiError(`Field too long: ${key}`, 'validation', 422, { field: key });
  if (required && s === '') throw new ApiError(`Missing field: ${key}`, 'validation', 422, { field: key });
  return s;
}

export const oneLine = (s: string | null) => (s === null ? null : s.replace(/\s+/g, ' ').trim());
export const locale = (v: unknown): 'en' | 'nl' => (v === 'nl' ? 'nl' : 'en');
export const int = (v: unknown, d = 0) => { const n = Number.parseInt(String(v ?? ''), 10); return Number.isFinite(n) ? n : d; };
export const bool = (v: unknown) => v === true || v === 1 || v === '1' || v === 'true';

export function isEmail(e: string): boolean {
  return /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(e) && e.length <= 190;
}
