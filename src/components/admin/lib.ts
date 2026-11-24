/* eslint-disable @typescript-eslint/no-explicit-any -- admin views render loosely-typed API JSON */
"use client";
import { API_BASE } from "@/lib/assessment/api";

export type User = { id: number; email: string; name: string; role: string; caps: string[] };
let csrf = "";
export const setCsrf = (c: string) => { csrf = c; };
export const getCsrf = () => csrf;

export class AdminError extends Error {
  constructor(message: string, public status: number, public code: string, public details: Record<string, unknown> = {}) { super(message); }
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/admin${path}`, {
    method, credentials: "same-origin",
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(method !== "GET" ? { "x-csrf-token": csrf } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).catch(() => { throw new AdminError("Cannot reach the server.", 0, "network"); });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && path !== "/login" && path !== "/me") window.dispatchEvent(new Event("bk-admin-logout"));
    const details = json?.error?.details ?? {};
    const extra = Array.isArray(details.errors) ? `: ${details.errors.join("; ")}` : "";
    throw new AdminError((json?.error?.message ?? `Request failed (${res.status})`) + extra, res.status, json?.error?.code ?? "error", details);
  }
  return json as T;
}

/** Download a file (CSV/PDF/JSON) through an authenticated GET. */
export async function download(path: string, filename: string) {
  const res = await fetch(`${API_BASE}/admin${path}`, { credentials: "same-origin" });
  if (!res.ok) throw new AdminError("Download failed", res.status, "download");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const fmtDate = (s?: string | null) => (s ? new Date(s.replace(" ", "T") + "Z").toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–");
export const L = (v: any) => (v && typeof v === "object" ? v.en ?? "" : v ?? "");
export const can = (u: User | null, cap: string) => !!u?.caps.includes(cap);
export const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", consultation_scheduled: "Consultation scheduled", proposal_sent: "Proposal sent", converted: "Converted", closed: "Closed" };

/* ------------------------------ Formatting ------------------------------ */
const parseTs = (s: string) => new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
export const fmtDay = (s?: string | null) => (s ? parseTs(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "–");
export const fmtNum = (n?: number | null) => (n === null || n === undefined ? "–" : n.toLocaleString("en-GB"));
export const fmtPct = (n?: number | null) => (n === null || n === undefined ? "–" : `${n.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%`);
export function timeAgo(s?: string | null): string {
  if (!s) return "–";
  const d = (Date.now() - parseTs(s).getTime()) / 1000;
  if (d < 45) return "just now";
  if (d < 3600) return `${Math.round(d / 60)} min ago`;
  if (d < 86400) return `${Math.round(d / 3600)} h ago`;
  if (d < 7 * 86400) return `${Math.round(d / 86400)} d ago`;
  return fmtDay(s);
}
export const isPast = (s?: string | null) => !!s && parseTs(s).getTime() <= Date.now();

/* ------------------------------ Hash routing ------------------------------ */
/** Current admin route from the URL hash: "#/leads/12?status=new" → { section: "leads", id: "12", query }. */
export function parseRoute(hash: string) {
  const raw = hash.replace(/^#\/?/, "") || "overview";
  const [path, qs] = raw.split("?");
  const [section, ...rest] = path.split("/");
  return { section: section || "overview", id: rest.length ? decodeURIComponent(rest.join("/")) : undefined, query: new URLSearchParams(qs ?? "") };
}
export const STATUS_ORDER = ["new", "contacted", "qualified", "consultation_scheduled", "proposal_sent", "converted", "closed"] as const;
