import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { loadConfig } from './config';
import { db } from './db';
import { ApiError } from './http';

/**
 * Image library. Only PNG, JPEG, WebP and GIF are accepted (checked by file signature, not by
 * name or declared type); SVG is refused because it can carry scripts. Files get random names and
 * are served from /media with a restrictive CSP.
 */
export const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, { ext: string; mime: string }> = {
  png: { ext: 'png', mime: 'image/png' }, jpeg: { ext: 'jpg', mime: 'image/jpeg' }, webp: { ext: 'webp', mime: 'image/webp' }, gif: { ext: 'gif', mime: 'image/gif' },
};
const FILE_RE = /^[a-f0-9]{24}\.(png|jpg|webp|gif)$/;
const MIME_BY_EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

export function sniff(b: Buffer): keyof typeof TYPES | null {
  if (b.length < 12) return null;
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('ascii', 0, 6) === 'GIF87a' || b.toString('ascii', 0, 6) === 'GIF89a') return 'gif';
  return null;
}

/** Image dimensions from the file header (no native image libraries needed). */
export function dimensions(b: Buffer, type: string): { width: number; height: number } | null {
  try {
    if (type === 'png') return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (type === 'gif') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    if (type === 'webp') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (chunk === 'VP8L') { const n = b.readUInt32LE(21); return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }; }
      if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    }
    if (type === 'jpeg') {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(m)) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch { /* unreadable header */ }
  return null;
}

export const Media = {
  dir(): string { const d = loadConfig().mediaDir; fs.mkdirSync(d, { recursive: true, mode: 0o755 }); return d; },

  async upload(buf: Buffer, originalName: string, alt: string | null, userId: number | null) {
    if (!Buffer.isBuffer(buf) || !buf.length) throw new ApiError('No file received.', 'validation', 422);
    if (buf.length > MAX_BYTES) throw new ApiError('Images must be 5 MB or smaller.', 'too_large', 413);
    const type = sniff(buf);
    if (!type) throw new ApiError('Only PNG, JPEG, WebP and GIF images are allowed.', 'validation', 422);
    const t = TYPES[type];
    const file = `${crypto.randomBytes(12).toString('hex')}.${t.ext}`;
    fs.writeFileSync(path.join(Media.dir(), file), buf, { mode: 0o644, flag: 'wx' });
    const dim = dimensions(buf, type);
    const name = (originalName || 'image').replace(/[^\w .()-]/g, '_').slice(0, 190);
    const id = await db.insert('media', { file, original_name: name, mime: t.mime, size: buf.length, width: dim?.width ?? null, height: dim?.height ?? null, alt: alt?.slice(0, 300) ?? null, created_by: userId });
    return { id, url: `/media/${file}`, file, width: dim?.width ?? null, height: dim?.height ?? null };
  },

  async list() {
    const rows = await db.all('SELECT m.*, u.name uploaded_by FROM media m LEFT JOIN users u ON u.id = m.created_by ORDER BY m.id DESC');
    const docs = await db.all<{ doc_key: string; data: string }>('SELECT doc_key, data FROM content_docs');
    return rows.map((m) => ({ ...m, url: `/media/${m.file}`, used_in: docs.filter((d) => d.data.includes(`/media/${m.file}`)).map((d) => d.doc_key) }));
  },

  async remove(id: number, force: boolean) {
    const m = await db.one('SELECT * FROM media WHERE id = ?', [id]);
    if (!m) throw new ApiError('Image not found', 'not_found', 404);
    const used = (await db.all<{ doc_key: string }>('SELECT doc_key FROM content_docs WHERE data LIKE ?', [`%/media/${m.file}%`])).map((d) => d.doc_key);
    if (used.length && !force) throw new ApiError(`This image is used in: ${used.join(', ')}. Replace it there first.`, 'conflict', 409, { used_in: used });
    await db.run('DELETE FROM media WHERE id = ?', [id]);
    try { fs.unlinkSync(path.join(Media.dir(), m.file)); } catch { /* already gone */ }
    return { file: m.file };
  },
};

export function mediaFileHandler(req: Request, res: Response) {
  const f = String(req.params.file ?? '');
  if (!FILE_RE.test(f)) { res.status(404).end(); return; }
  const p = path.join(loadConfig().mediaDir, f);
  if (!fs.existsSync(p)) { res.status(404).end(); return; }
  res.set({
    'Content-Type': MIME_BY_EXT[f.split('.').pop()!], 'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Security-Policy': "default-src 'none'; sandbox", 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(p).pipe(res);
}
