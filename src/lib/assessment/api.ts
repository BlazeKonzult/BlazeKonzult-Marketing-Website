import type { Locale, LStr } from "./i18n";

/** Same-origin API served by the Node app at /api (cPanel). Override for local development with NEXT_PUBLIC_API_BASE. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "/api").replace(/\/$/, "");

export type Cond = { mode?: "all" | "any"; rules: { q: string; op: string; value?: unknown }[] } | null;
export type ClientQuestion = {
  code: string; category: string; type: "maturity" | "yes_no" | "single" | "multi" | "number";
  title: string; description: string; options: { value: string | number; label: string }[];
  allow_na: boolean; allow_unsure: boolean; required: boolean; condition: Cond; min: number | null; max: number | null; unit: string | null;
};
export type ClientTemplate = {
  slug: string; version_id: number; version: number; locale: Locale; name: string; summary: string; minutes: number;
  categories: { key: string; name: string; description: string }[]; questions: ClientQuestion[]; special: { na: string; unsure: string };
};
export type PublicTemplate = { slug: string; name: string; summary: string; minutes: number; questions: number; version: number; sort: number };
export type Answers = Record<string, unknown>;

export type Result = {
  overall: number | null; classification: { key: string; label: LStr } | null; coverage: number; uncertainty: number;
  counts: { applicable: number; answered: number; unsure: number; na: number; skipped: number };
  categories: { key: string; name: LStr; score: number | null; level: { key: string; label: LStr } | null; applicable: number; answered: number; unsure: number; na: number }[];
  gaps: { code: string; category: string; risk: string; title: LStr; question: LStr; answer: "unsure" | "low" }[];
  strengths: string[];
  recommendations: { code: string; priority: string; category: string; title: LStr; description: LStr; impact: LStr | null; remediation: LStr | null; timeframe: LStr | null; service: string | null }[];
  services: string[];
};
export type ResultPayload = {
  ref: string; created_at: string; locale: Locale; has_lead: boolean;
  template: { slug: string; name: LStr; version: number }; thresholds: { min: number; key: string; label: LStr }[]; result: Result;
};

export class ApiFailure extends Error {
  constructor(message: string, public code: string, public status: number, public details: Record<string, unknown> = {}) { super(message); }
}

export async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method, credentials: "same-origin",
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiFailure("network", "network", 0);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiFailure(json?.error?.message ?? "error", json?.error?.code ?? "error", res.status, json?.error?.details ?? {});
  return json as T;
}

/* ----- Visibility: mirrors the server engine so the wizard only shows relevant questions ----- */
const blank = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
const strs = (v: unknown) => (Array.isArray(v) ? v : [v]).map(String);

export function visibleCodes(qs: ClientQuestion[], a: Answers): Set<string> {
  const vis = new Set<string>();
  for (const q of qs) {
    const c = q.condition;
    let ok = true;
    if (c?.rules?.length) {
      const res = c.rules.map((r) => {
        const has = vis.has(r.q) && !blank(a[r.q]);
        const v = has ? a[r.q] : null;
        const vals = strs(r.value ?? []);
        switch (r.op) {
          case "answered": return has;
          case "not_answered": return !has;
          case "in": return has && strs(v).some((x) => vals.includes(x));
          case "not_in": return has && !strs(v).some((x) => vals.includes(x));
          case "gte": return has && Number(v) >= Number(r.value);
          case "lte": return has && Number(v) <= Number(r.value);
          default: return false;
        }
      });
      ok = (c.mode ?? "all") === "any" ? res.includes(true) : !res.includes(false);
    }
    if (ok) vis.add(q.code);
  }
  return vis;
}

export function checkAnswer(q: ClientQuestion, v: unknown): "required" | "out_of_range" | "invalid" | null {
  if (blank(v)) return q.required ? "required" : null;
  if (v === "na" || v === "unsure") return null;
  if (q.type === "number") {
    const n = Number(v);
    if (!Number.isFinite(n) || String(v).trim() === "") return "invalid";
    if ((q.min !== null && n < q.min) || (q.max !== null && n > q.max)) return "out_of_range";
  }
  return null;
}

/** Only visible, non-blank answers are sent; the server validates everything again. */
export function cleanAnswers(qs: ClientQuestion[], a: Answers): Answers {
  const vis = visibleCodes(qs, a);
  const out: Answers = {};
  for (const q of qs) if (vis.has(q.code) && !blank(a[q.code])) out[q.code] = q.type === "number" && a[q.code] !== "na" && a[q.code] !== "unsure" ? Number(a[q.code]) : a[q.code];
  return out;
}

export function uuid(): string {
  const c = globalThis.crypto as Crypto & { randomUUID?: () => string };
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** localStorage helpers that never throw (private mode, quota, disabled storage). */
export const store = {
  get<T>(k: string): T | null { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
