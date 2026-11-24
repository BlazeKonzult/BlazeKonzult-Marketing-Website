/* eslint-disable @typescript-eslint/no-explicit-any -- walks arbitrary content JSON */
"use client";

/**
 * Website content status, computed from the saved documents merged over the built-in defaults
 * (exactly what the public site renders). Used by the dashboard, pages list, SEO centre and
 * localization views. All checks are internal; no external search data is involved.
 */
import { useMemo } from "react";
import { REGISTRY, defaultsFor, defaultArticleSlugs, articleDefaults, newArticle, type ArticleDoc } from "@/content/defaults";
import { mergeDefaults } from "@/content/merge";
import { localizeHref } from "@/lib/locale";
import { api } from "./lib";
import { useLoad } from "./ui";

export type Loc = "en" | "nl";
export type SeoInfo = { title: string; description: string; titleSource: "own" | "fallback" | "none" };
export type ContentItem = {
  id: string; storeKey: string; baseKey: string; loc: Loc; kind: "page" | "article" | "site"; label: string; group: string; path: string;
  edited: boolean; updated_at: string | null; updated_by: string | null; status: "published" | "draft"; data: any; seo: SeoInfo;
};

const IMAGE_KEY = /^(image|src|coverImage|founderPhoto|socialImage|.*Image|.*Photo)$/;

export function useSiteContent() {
  const raw = useLoad(() => api("GET", "/content-bulk"));
  const items = useMemo<ContentItem[] | null>(() => {
    if (!raw.data) return null;
    const saved = new Map<string, any>(raw.data.docs.map((d: any) => [d.doc_key, d]));
    const out: ContentItem[] = [];
    for (const r of REGISTRY) {
      for (const loc of ["en", "nl"] as Loc[]) {
        const sk = loc === "nl" ? `nl:${r.key}` : r.key;
        const s = saved.get(sk);
        const data = mergeDefaults(defaultsFor(r.key, loc) as any, s?.data);
        const seo = data?.seo ?? {};
        const pageTitle = data?.hero?.title ?? data?.title ?? "";
        out.push({ id: sk, storeKey: sk, baseKey: r.key, loc, kind: r.key === "site" ? "site" : "page", label: r.label, group: r.group, path: localizeHref(r.path, loc),
          edited: !!s, updated_at: s?.updated_at ?? null, updated_by: s?.updated_by_name ?? null, status: "published", data,
          seo: { title: seo.title ?? "", description: seo.description ?? "", titleSource: seo.title ? "own" : pageTitle ? "fallback" : "none" } });
      }
    }
    const slugs = new Set<string>([...defaultArticleSlugs, ...[...saved.keys()].filter((k) => k.startsWith("article:")).map((k) => k.slice(8))]);
    for (const slug of slugs) {
      const s = saved.get(`article:${slug}`);
      const en: ArticleDoc & { deleted?: boolean } = mergeDefaults((articleDefaults(slug) ?? newArticle()) as any, s?.data);
      if (en.deleted) continue;
      const nlSaved = saved.get(`nl:article:${slug}`);
      const variants: [Loc, any, any][] = [["en", en, s], ["nl", nlSaved ? mergeDefaults(en as any, nlSaved.data) : null, nlSaved]];
      for (const [loc, data, sv] of variants) {
        if (!data) continue;
        out.push({ id: `${loc === "nl" ? "nl:" : ""}article:${slug}`, storeKey: `${loc === "nl" ? "nl:" : ""}article:${slug}`, baseKey: `article:${slug}`, loc, kind: "article", label: data.title || slug, group: "Articles",
          path: `${loc === "nl" ? "/nl" : ""}/resources/${slug}/`, edited: !!sv, updated_at: sv?.updated_at ?? null, updated_by: sv?.updated_by_name ?? null, status: data.status === "draft" ? "draft" : "published", data,
          seo: { title: data.seo?.title ?? "", description: data.seo?.description || "", titleSource: data.seo?.title ? "own" : data.title ? "fallback" : "none" } });
      }
    }
    return out;
  }, [raw.data]);
  return { items, loading: raw.loading, error: raw.error, reload: raw.reload };
}

/* -------------------------------- SEO checks -------------------------------- */
export type SeoIssue = { severity: "high" | "medium" | "low"; code: string; text: string };
export function seoIssues(it: ContentItem, all: ContentItem[]): SeoIssue[] {
  if (it.kind === "site") return [];
  const out: SeoIssue[] = [];
  const t = it.seo.title || (it.kind === "article" ? it.data.title : "");
  const d = it.seo.description || (it.kind === "article" ? it.data.excerpt : "");
  if (!t) out.push({ severity: "high", code: "title_missing", text: "No page title" });
  else if (t.length > 65) out.push({ severity: "low", code: "title_long", text: `Title is ${t.length} characters; search results usually show about 60` });
  else if (t.length < 15) out.push({ severity: "low", code: "title_short", text: "Title is very short" });
  if (!d) out.push({ severity: "high", code: "desc_missing", text: "No meta description" });
  else if (d.length > 170) out.push({ severity: "low", code: "desc_long", text: `Description is ${d.length} characters; about 155 are shown` });
  else if (d.length < 50) out.push({ severity: "medium", code: "desc_short", text: "Description is shorter than 50 characters" });
  const peers = all.filter((x) => x !== it && x.loc === it.loc && x.kind !== "site" && x.status === "published");
  if (t && peers.some((x) => (x.seo.title || (x.kind === "article" ? x.data.title : "")) === t)) out.push({ severity: "medium", code: "title_dup", text: "Same title as another page" });
  if (d && peers.some((x) => (x.seo.description || (x.kind === "article" ? x.data.excerpt : "")) === d)) out.push({ severity: "medium", code: "desc_dup", text: "Same description as another page" });
  if (it.kind === "article" && it.data.coverImage && !it.data.coverAlt) out.push({ severity: "medium", code: "alt_missing", text: "Cover image has no alternative text" });
  return out;
}

/** Internal link targets that exist on the site (for broken-link checks). */
export function knownPaths(items: ContentItem[]): Set<string> {
  const s = new Set<string>(["/", "/cybersecurity-assessment/", "/cybersecurity-assessment/start/", "/assessment/"]);
  for (const it of items) s.add(it.path.replace(/^\/nl(?=\/)/, "").replace(/\/?$/, "/"));
  return s;
}
/** Find internal links in a document (markdown-style [text](/path) and href fields). */
export function internalLinks(data: any): string[] {
  const out: string[] = [];
  const walk = (v: any, key = "") => {
    if (typeof v === "string") {
      for (const m of v.matchAll(/\]\((\/[^)\s]*)\)/g)) out.push(m[1]);
      if (/href$/i.test(key) && v.startsWith("/") && !v.startsWith("//")) out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(data);
  return out;
}
export function brokenLinks(it: ContentItem, known: Set<string>): string[] {
  return [...new Set(internalLinks(it.data).filter((p) => {
    const clean = p.split(/[?#]/)[0].replace(/^\/nl(?=\/|$)/, "") || "/";
    if (/^\/(media|api)\//.test(clean) || /\.[a-z0-9]{2,5}$/i.test(clean)) return false;
    return !known.has(clean.endsWith("/") ? clean : clean + "/");
  }))];
}
/** Images used in a document (for alt-text checks). */
export function imagesIn(data: any): string[] {
  const out: string[] = [];
  const walk = (v: any, key = "") => {
    if (typeof v === "string") { if (IMAGE_KEY.test(key) && v) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(data);
  return out;
}

/** Count of filled text fields (for translation completeness). */
export function textFields(data: any): number {
  let n = 0;
  const walk = (v: any) => { if (typeof v === "string") { if (v.trim()) n++; } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
  walk(data);
  return n;
}
