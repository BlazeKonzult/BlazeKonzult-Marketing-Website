import "server-only";
import { cache } from "react";
import mysql from "mysql2/promise";
import { articleDefaults, defaultArticleSlugs, defaultsFor, storeKey, type ArticleDoc } from "./defaults";
import { getLocale } from "@/lib/locale-server";
import { mergeDefaults } from "./merge";

/**
 * Reads website content saved in the admin (table content_docs). Saved documents are merged over the
 * defaults, so new fields added in code still appear. A version number (bumped on every save) is
 * checked once per request; documents are cached in memory until it changes. If the database is
 * unreachable the site keeps working on the defaults.
 */
type DbCfg = { host: string; port: number; database: string; user: string; password: string };
function dbConfig(): DbCfg | null {
  if (process.env.BK_DB_JSON) { try { return JSON.parse(process.env.BK_DB_JSON); } catch { /* fall through */ } }
  if (!process.env.DB_NAME) return null;
  return { host: process.env.DB_HOST ?? "127.0.0.1", port: Number(process.env.DB_PORT ?? 3306), database: process.env.DB_NAME, user: process.env.DB_USER ?? "", password: process.env.DB_PASS ?? "" };
}

const g = globalThis as unknown as { __bkPool?: mysql.Pool | null; __bkCache?: { version: string; docs: Map<string, unknown> }; __bkWarned?: boolean };
function pool(): mysql.Pool | null {
  if (g.__bkPool !== undefined) return g.__bkPool;
  const c = dbConfig();
  g.__bkPool = c ? mysql.createPool({ ...c, connectionLimit: 4, charset: "utf8mb4", connectTimeout: 3000 }) : null;
  return g.__bkPool;
}
function warn(e: unknown) {
  if (!g.__bkWarned) { console.error("[content] database unavailable, serving default content:", (e as Error).message); g.__bkWarned = true; }
}

/** Content version for this request (one cheap query); null when the database is unavailable. */
const contentVersion = cache(async (): Promise<string | null> => {
  const p = pool();
  if (!p) return null;
  try {
    const [rows] = await p.query<mysql.RowDataPacket[]>("SELECT `value` FROM settings WHERE `key` = '_content_version'");
    return String(rows[0]?.value ?? "0");
  } catch (e) { warn(e); return null; }
});

async function cacheFor(version: string) {
  if (!g.__bkCache || g.__bkCache.version !== version) g.__bkCache = { version, docs: new Map() };
  return g.__bkCache;
}

async function loadSaved(key: string): Promise<unknown> {
  const v = await contentVersion();
  if (v === null) return undefined;
  const c = await cacheFor(v);
  if (c.docs.has(key)) return c.docs.get(key);
  try {
    const [rows] = await pool()!.query<mysql.RowDataPacket[]>("SELECT data FROM content_docs WHERE doc_key = ?", [key]);
    const val = rows[0] ? JSON.parse(rows[0].data) : undefined;
    c.docs.set(key, val);
    return val;
  } catch (e) { warn(e); return undefined; }
}

export const getDoc = cache(async <T,>(key: string): Promise<T> => {
  const loc = await getLocale();
  const def = defaultsFor(key, loc) as T;
  return mergeDefaults(def, await loadSaved(storeKey(key, loc)));
});

export type StoredArticle = ArticleDoc & { slug: string; translated: boolean };

async function savedArticles(prefix: string): Promise<{ slug: string; data: ArticleDoc & { deleted?: boolean } }[]> {
  const v = await contentVersion();
  if (v === null) return [];
  const c = await cacheFor(v);
  const k = `__articles:${prefix}`;
  if (!c.docs.has(k)) {
    try {
      const [rows] = await pool()!.query<mysql.RowDataPacket[]>("SELECT doc_key, data FROM content_docs WHERE doc_key LIKE ?", [`${prefix}%`]);
      c.docs.set(k, rows.map((r) => ({ slug: String(r.doc_key).slice(prefix.length), data: JSON.parse(r.data) })));
    } catch (e) { warn(e); c.docs.set(k, []); }
  }
  return c.docs.get(k) as { slug: string; data: ArticleDoc & { deleted?: boolean } }[];
}

/**
 * All articles for the current language: built-in articles merged with saved ones, plus articles
 * created in the admin. On Dutch pages a saved Dutch version replaces the English text; articles
 * without a translation are shown in English (translated: false).
 */
export const getArticles = cache(async (opts: { includeDrafts?: boolean } = {}): Promise<StoredArticle[]> => {
  const loc = await getLocale();
  const bySlug = new Map<string, StoredArticle>();
  for (const slug of defaultArticleSlugs) bySlug.set(slug, { slug, translated: loc === "en", ...articleDefaults(slug)! });
  for (const s of await savedArticles("article:")) {
    if (s.data?.deleted) { bySlug.delete(s.slug); continue; }
    const base = articleDefaults(s.slug);
    bySlug.set(s.slug, { slug: s.slug, translated: loc === "en", ...(base ? mergeDefaults(base, s.data) : s.data) });
  }
  if (loc === "nl") {
    for (const s of await savedArticles("nl:article:")) {
      if (s.data?.deleted) { bySlug.delete(s.slug); continue; }
      const en = bySlug.get(s.slug);
      bySlug.set(s.slug, { slug: s.slug, ...(en ? mergeDefaults(en, s.data) : (s.data as ArticleDoc)), translated: true });
    }
  }
  return [...bySlug.values()]
    .filter((a) => opts.includeDrafts || a.status !== "draft")
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
});

export const getArticle = cache(async (slug: string) => (await getArticles()).find((a) => a.slug === slug) ?? null);
