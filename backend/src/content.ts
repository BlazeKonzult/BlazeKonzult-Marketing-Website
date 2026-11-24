import { db } from './db';
import { ApiError } from './http';

/**
 * Website content documents edited in the admin. The website (Next.js) reads them from
 * content_docs and merges them over its built-in defaults; every save bumps a version number
 * so the site picks up changes immediately. Each save is kept as a revision for rollback.
 */
export const KEY_RE = /^(?:nl:)?(site|page:[a-z0-9]+(?:-[a-z0-9]+)*|service:[a-z0-9]+(?:-[a-z0-9]+)*|article:[a-z0-9]+(?:-[a-z0-9]+)*)$/;
const MAX_BYTES = 400_000;
const MAX_STRING = 30_000;
const MAX_DEPTH = 12;
const KEEP_REVISIONS = 50;
const SAFE_URL = /^(\/(?!\/)|#|https:\/\/|http:\/\/|mailto:)/i;
const URL_KEYS = /^(href|url|linkedin|.*Href|.*Url|.*Image|image|src|coverImage|founderPhoto|socialImage)$/;

export function checkKey(key: string): string {
  if (typeof key !== 'string' || key.length > 120 || !KEY_RE.test(key)) throw new ApiError('Invalid content key', 'validation', 422);
  return key;
}

/** Validates structure, size and every link/image value; strips control characters. */
export function sanitizeDoc(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError('Content must be an object', 'validation', 422);
  const errors: string[] = [];
  const walk = (v: unknown, path: string, depth: number, key: string): unknown => {
    if (depth > MAX_DEPTH) { errors.push(`${path}: nested too deeply`); return null; }
    if (typeof v === 'string') {
      // eslint-disable-next-line no-control-regex
      const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
      if (s.length > MAX_STRING) errors.push(`${path}: text too long`);
      if (URL_KEYS.test(key) && s.trim() && !SAFE_URL.test(s.trim())) errors.push(`${path}: links must start with /, #, https:// or mailto:`);
      return s;
    }
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'boolean' || v === null) return v;
    if (Array.isArray(v)) { if (v.length > 500) errors.push(`${path}: too many items`); return v.slice(0, 500).map((x, i) => walk(x, `${path}[${i}]`, depth + 1, key)); }
    if (typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k.length > 60) continue;
        out[k] = walk(x, path ? `${path}.${k}` : k, depth + 1, k);
      }
      return out;
    }
    errors.push(`${path}: unsupported value`);
    return null;
  };
  const out = walk(value, '', 0, '') as Record<string, unknown>;
  if (JSON.stringify(out).length > MAX_BYTES) errors.push('Document is too large');
  if (errors.length) throw new ApiError(errors[0], 'validation', 422, { errors: errors.slice(0, 20) });
  return out;
}

export async function bumpVersion(cx?: any) {
  await db.run("INSERT INTO settings (`key`, `value`) VALUES ('_content_version', '1') ON DUPLICATE KEY UPDATE `value` = CAST(`value` AS UNSIGNED) + 1", [], cx);
}

export const Content = {
  async list() {
    return db.all(`SELECT d.doc_key, d.updated_at, u.name updated_by_name, LENGTH(d.data) size,
      (SELECT COUNT(*) FROM content_revisions r WHERE r.doc_key = d.doc_key) revisions FROM content_docs d LEFT JOIN users u ON u.id = d.updated_by ORDER BY d.doc_key`);
  },
  async get(key: string) {
    const r = await db.one('SELECT data, updated_at FROM content_docs WHERE doc_key = ?', [checkKey(key)]);
    return r ? { data: JSON.parse(r.data), updated_at: r.updated_at } : null;
  },
  async save(key: string, value: unknown, userId: number | null, action = 'save') {
    checkKey(key);
    const data = JSON.stringify(sanitizeDoc(value));
    await db.tx(async (cx) => {
      await db.run('INSERT INTO content_docs (doc_key, data, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), updated_by = VALUES(updated_by)', [key, data, userId], cx);
      await db.run('INSERT INTO content_revisions (doc_key, data, action, user_id) VALUES (?, ?, ?, ?)', [key, data, action, userId], cx);
      const old = await db.all<{ id: number }>(`SELECT id FROM content_revisions WHERE doc_key = ? ORDER BY id DESC LIMIT 1000 OFFSET ${KEEP_REVISIONS}`, [key], cx);
      if (old.length) await db.run(`DELETE FROM content_revisions WHERE id IN (${old.map(() => '?').join(',')})`, old.map((o) => o.id), cx);
      await bumpVersion(cx);
    });
  },
  /** Removes the saved document, so the page falls back to its built-in default content. */
  async reset(key: string, userId: number | null) {
    checkKey(key);
    await db.tx(async (cx) => {
      await db.run('DELETE FROM content_docs WHERE doc_key = ?', [key], cx);
      await db.run("INSERT INTO content_revisions (doc_key, data, action, user_id) VALUES (?, NULL, 'reset', ?)", [key, userId], cx);
      await bumpVersion(cx);
    });
  },
  async revisions(key: string) {
    return db.all('SELECT r.id, r.action, r.created_at, u.name user_name, LENGTH(r.data) size FROM content_revisions r LEFT JOIN users u ON u.id = r.user_id WHERE r.doc_key = ? ORDER BY r.id DESC', [checkKey(key)]);
  },
  async revision(id: number) {
    const r = await db.one('SELECT * FROM content_revisions WHERE id = ?', [id]);
    if (!r) throw new ApiError('Revision not found', 'not_found', 404);
    return { id: r.id, doc_key: r.doc_key, action: r.action, created_at: r.created_at, data: r.data ? JSON.parse(r.data) : null };
  },
  async restore(id: number, userId: number | null) {
    const r = await Content.revision(id);
    if (r.data === null) await Content.reset(r.doc_key, userId);
    else await Content.save(r.doc_key, r.data, userId, 'restore');
    return r.doc_key;
  },
};
