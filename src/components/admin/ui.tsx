/* eslint-disable @typescript-eslint/no-explicit-any -- admin views render loosely-typed API JSON */
"use client";

/**
 * Command Centre component library: page and section headers, cards, buttons, badges, form
 * controls, tables, skeletons, empty and error states, tabs, dialogs, menus, toasts.
 * Every component reads the theme tokens from globals.css (.admin-root), so light and dark
 * mode need no per-component work.
 */
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Inbox, RefreshCw, Search, X, XCircle, type LucideIcon } from "lucide-react";
import { AdminError } from "./lib";

/* ---------------------------------- Data ---------------------------------- */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const key = JSON.stringify(deps);
  useEffect(() => {
    let live = true;
    fnRef.current().then((d) => { if (live) { setData(d); setError(null); } }).catch((e: AdminError) => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [key, tick]);
  const reload = useCallback(() => { setLoading(true); setTick((t) => t + 1); }, []);
  return { data, error, loading, reload, setData };
}

/** Debounced value (search boxes). */
export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/* --------------------------------- Layout --------------------------------- */
export function Page({ title, actions, children, lead, eyebrow, meta }: { title: ReactNode; actions?: ReactNode; children: ReactNode; lead?: ReactNode; eyebrow?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="a-fade">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="mb-1 text-[0.8125rem] font-medium text-muted">{eyebrow}</p>}
          <h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.015em] text-heading sm:text-[1.75rem]">{title}</h1>
          {lead && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{lead}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2" data-noprint>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeader({ title, lead, actions, as: H = "h2" }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><H className="text-[1.0625rem] font-semibold text-heading">{title}</H>{lead && <p className="mt-0.5 text-[0.8125rem] text-muted">{lead}</p>}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export const Card = ({ title, children, className = "", actions, lead, pad = true, id }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode; lead?: ReactNode; pad?: boolean; id?: string }) => (
  <section id={id} className={`min-w-0 rounded-xl border border-line bg-surface shadow-[var(--a-shadow-card)] ${className}`}>
    {(title || actions) && (
      <div className={`flex flex-wrap items-start justify-between gap-3 ${pad ? "px-5 pt-4" : "border-b border-line px-5 py-3.5"}`}>
        <div className="min-w-0">{title && <h2 className="text-[0.9375rem] font-semibold text-heading">{title}</h2>}{lead && <p className="mt-0.5 text-[0.8125rem] text-muted">{lead}</p>}</div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={pad ? (title || actions ? "px-5 pb-5 pt-3" : "p-5") : ""}>{children}</div>
  </section>
);

/* --------------------------------- Buttons --------------------------------- */
type BtnKind = "primary" | "secondary" | "danger" | "ghost" | "subtle";
const BTN: Record<BtnKind, string> = {
  primary: "bg-brand text-white border-brand hover:bg-brand-600 hover:border-brand-600 shadow-[0_1px_2px_rgb(16_24_40/0.12)]",
  secondary: "bg-surface text-heading border-line-strong hover:bg-surface-2 shadow-[0_1px_2px_rgb(16_24_40/0.05)]",
  danger: "bg-surface text-risk-fg border-line-strong hover:bg-risk-bg hover:border-risk-fg/40",
  ghost: "border-transparent text-cobalt hover:bg-mist",
  subtle: "border-transparent text-body hover:bg-mist hover:text-heading",
};
export function Btn({ children, onClick, kind = "secondary", disabled, type = "button", small, href, title, label, target, busy, className = "" }: {
  children: ReactNode; onClick?: () => void; kind?: BtnKind; disabled?: boolean; type?: "button" | "submit"; small?: boolean; href?: string; title?: string; label?: string; target?: string; busy?: boolean; className?: string;
}) {
  const cls = `inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-semibold transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${small ? "min-h-8 px-2.5 text-[0.8125rem]" : "min-h-10 px-3.5 text-sm"} ${BTN[kind]} ${className}`;
  if (href) return <a href={href} className={cls} title={title} aria-label={label} target={target} rel={target ? "noopener" : undefined}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled || busy} className={cls} title={title} aria-label={label} aria-busy={busy || undefined}>{busy && <RefreshCw size={14} className="animate-spin" aria-hidden="true" />}{children}</button>;
}

export function IconBtn({ icon: I, label, onClick, href, active, className = "", size = 18 }: { icon: LucideIcon; label: string; onClick?: () => void; href?: string; active?: boolean; className?: string; size?: number }) {
  const cls = `relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-mist hover:text-heading ${active ? "bg-mist text-heading" : ""} ${className}`;
  if (href) return <a href={href} className={cls} aria-label={label} title={label}><I size={size} aria-hidden="true" /></a>;
  return <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}><I size={size} aria-hidden="true" /></button>;
}

/* --------------------------------- Badges --------------------------------- */
export type Tone = "neutral" | "ok" | "warn" | "risk" | "brand" | "info";
const TONE: Record<Tone, string> = {
  neutral: "bg-mist text-body ring-line", ok: "bg-ok-bg text-ok-fg ring-ok-fg/20", warn: "bg-warn-bg text-warn-fg ring-warn-fg/20",
  risk: "bg-risk-bg text-risk-fg ring-risk-fg/20", brand: "bg-brand-50 text-brand-fg ring-brand-fg/20", info: "bg-info-bg text-info-fg ring-info-fg/20",
};
export const Badge = ({ children, tone = "neutral", dot }: { children: ReactNode; tone?: Tone; dot?: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE[tone]}`}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}{children}
  </span>
);

const STATUS_TONES: Record<string, Tone> = {
  published: "ok", active: "ok", sent: "ok", converted: "ok", ok: "ok", on: "ok", pass: "ok",
  draft: "warn", queued: "warn", warn: "warn", proposal_sent: "info", consultation_scheduled: "brand", qualified: "info", contacted: "neutral",
  new: "brand", failed: "risk", fail: "risk", revoked: "risk", risk: "risk", high: "risk", critical: "risk", medium: "warn", low: "neutral",
  archived: "neutral", closed: "neutral", expired: "neutral", unknown: "neutral", not_available: "neutral", info: "info", disabled: "neutral",
};
/** Status badge with an icon-free dot: meaning is in the text, colour only reinforces it. */
export const StatusBadge = ({ status, label }: { status: string; label?: string }) => <Badge tone={STATUS_TONES[status] ?? "neutral"} dot>{label ?? status.replace(/_/g, " ")}</Badge>;

/* ---------------------------------- Forms ---------------------------------- */
export function Field({ label, children, hint, required, error }: { label: string; children: ReactNode; hint?: ReactNode; required?: boolean; error?: string | null }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-heading">{label}{required && <span className="text-risk-fg" aria-hidden="true"> *</span>}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-risk-fg" role="alert">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export const inputCls = "w-full min-h-10 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-heading shadow-[0_1px_2px_rgb(16_24_40/0.05)] placeholder:text-muted/70 transition-[border-color,box-shadow] hover:border-muted/50 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:bg-mist disabled:text-muted";

export function SearchInput({ value, onChange, placeholder = "Search…", label = "Search", className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string; className?: string }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input type="search" className={`${inputCls} pl-9`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Switch({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0"><label htmlFor={id} className="text-sm font-medium text-heading">{label}</label>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-brand" : "bg-line-strong"}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[1.375rem]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function FilterBar({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3 shadow-[var(--a-shadow-card)] [&>*]:min-w-[10rem] [&>*]:flex-1 sm:[&>*]:flex-none">{children}{actions && <div className="ml-auto flex flex-none items-end gap-2">{actions}</div>}</div>;
}

/* ------------------------------ States ------------------------------ */
export const Skeleton = ({ className = "h-4 w-full" }: { className?: string }) => <div className={`a-skel ${className}`} aria-hidden="true" />;
export function Loading({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3 py-2">
      <span className="sr-only">{label}…</span>
      <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className={`h-10 ${i % 2 ? "w-11/12" : "w-full"}`} />)}
    </div>
  );
}
export function ErrorBox({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="my-3 flex flex-wrap items-start gap-3 rounded-xl border border-risk-fg/25 bg-risk-bg p-4 text-sm text-risk-fg" role="alert">
      <XCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="font-semibold">Something went wrong</p><p className="mt-0.5">{children || "The request failed."}</p></div>
      {onRetry && <Btn small onClick={onRetry}><RefreshCw size={13} /> Try again</Btn>}
    </div>
  );
}
export function EmptyState({ icon: I = Inbox, title, children, actions, compact }: { icon?: LucideIcon; title: string; children?: ReactNode; actions?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-4 py-6" : "px-6 py-12"}`}>
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-2 text-muted"><I size={20} aria-hidden="true" /></span>
      <p className="text-[0.9375rem] font-semibold text-heading">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
/** Short empty message (inside cards). */
export const Empty = ({ children }: { children: ReactNode }) => <p className="py-6 text-center text-sm text-muted">{children}</p>;

export function Notice({ tone = "info", title, children, actions }: { tone?: "info" | "warn" | "ok" | "risk"; title?: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  const I = tone === "ok" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return (
    <div className={`flex flex-wrap items-start gap-3 rounded-xl border p-3.5 text-sm ${tone === "info" ? "border-info-fg/20 bg-info-bg text-info-fg" : tone === "warn" ? "border-warn-fg/25 bg-warn-bg text-warn-fg" : tone === "ok" ? "border-ok-fg/20 bg-ok-bg text-ok-fg" : "border-risk-fg/25 bg-risk-bg text-risk-fg"}`} role={tone === "risk" ? "alert" : "status"}>
      <I size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{title && <p className="font-semibold">{title}</p>}{children && <div className={title ? "mt-0.5" : ""}>{children}</div>}</div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------------------------- Tables ---------------------------------- */
export function Table({ head, children, minWidth = 640, sticky }: { head: ReactNode[]; children: ReactNode; minWidth?: number; sticky?: boolean }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border border-line bg-surface shadow-[var(--a-shadow-card)]">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className={`border-b border-line bg-surface-2 text-xs font-medium text-muted ${sticky ? "sticky top-0 z-10" : ""}`}><tr>{head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <td className={`px-4 py-3 align-middle text-body ${className}`}>{children}</td>;

export function Pager({ page, size, total, onPage }: { page: number; size: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (total <= 0) return null;
  const from = (page - 1) * size + 1; const to = Math.min(total, page * size);
  return (
    <nav className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.8125rem] text-muted" aria-label="Pagination">
      <span className="tnum">Showing {from}–{to} of {total}</span>
      {pages > 1 && <span className="flex items-center gap-1">
        <Btn small disabled={page <= 1} onClick={() => onPage(page - 1)} label="Previous page"><ChevronLeft size={15} /></Btn>
        <span className="tnum px-2">Page {page} of {pages}</span>
        <Btn small disabled={page >= pages} onClick={() => onPage(page + 1)} label="Next page"><ChevronRight size={15} /></Btn>
      </span>}
    </nav>
  );
}

/* ----------------------------------- Tabs ----------------------------------- */
export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { key: T; label: ReactNode; count?: number | null }[]; value: T; onChange: (v: T) => void; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div role="tablist" aria-label={label} className="relative mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t, i) => (
        <button key={t.key} ref={(el) => { refs.current[i] = el; }} role="tab" aria-selected={value === t.key} tabIndex={value === t.key ? 0 : -1}
          onKeyDown={(e) => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; const n = (i + d + tabs.length) % tabs.length; onChange(tabs[n].key); refs.current[n]?.focus(); }}
          onClick={() => onChange(t.key)}
          className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${value === t.key ? "border-brand text-heading" : "border-transparent text-muted hover:text-heading"}`}>
          {t.label}{t.count !== undefined && t.count !== null && <span className="tnum rounded-full bg-mist px-1.5 text-xs text-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Dialogs ---------------------------------- */
function useFocusTrap(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    (el?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab") { const f = focusables(); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);
  return ref;
}

export function Modal({ open, onClose, title, children, footer, size = "md", description }: { open: boolean; onClose: () => void; title: ReactNode; children?: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl"; description?: ReactNode }) {
  const ref = useFocusTrap(open, onClose);
  const titleId = useId();
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-[#0b1424]/55 p-4 pt-[10vh] backdrop-blur-[2px] a-fade" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`a-pop w-full ${w} rounded-2xl border border-line bg-surface shadow-[var(--a-shadow-pop)]`}>
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0"><h2 id={titleId} className="text-lg font-semibold text-heading">{title}</h2>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
          <IconBtn icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

/* Promise-based confirm and prompt dialogs, replacing window.confirm / window.prompt. */
type AskOpts = { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean; input?: { label: string; value?: string; type?: string; minLength?: number; hint?: string } };
type AskState = AskOpts & { resolve: (v: string | boolean | null) => void };
let askHandler: ((s: AskState) => void) | null = null;
export function confirmDialog(o: Omit<AskOpts, "input">): Promise<boolean> {
  return new Promise((resolve) => { if (!askHandler) { resolve(window.confirm(o.title)); return; } askHandler({ ...o, resolve: (v) => resolve(!!v) }); });
}
export function promptDialog(o: AskOpts & { input: NonNullable<AskOpts["input"]> }): Promise<string | null> {
  return new Promise((resolve) => { if (!askHandler) { resolve(window.prompt(o.title, o.input.value)); return; } askHandler({ ...o, resolve: (v) => resolve(typeof v === "string" ? v : null) }); });
}
export function DialogHost() {
  const [s, setS] = useState<AskState | null>(null);
  const [val, setVal] = useState("");
  useEffect(() => { askHandler = (x) => { setVal(x.input?.value ?? ""); setS(x); }; return () => { askHandler = null; }; }, []);
  const close = useCallback((v: string | boolean | null) => { setS((cur) => { cur?.resolve(v); return null; }); }, []);
  const cancel = useCallback(() => close(null), [close]);
  if (!s) return null;
  const valid = !s.input || (val.length >= (s.input.minLength ?? 1));
  return (
    <Modal open onClose={cancel} title={s.title} size="sm"
      footer={<><Btn onClick={cancel}>Cancel</Btn><Btn kind={s.danger ? "danger" : "primary"} disabled={!valid} onClick={() => close(s.input ? val : true)} className={s.danger ? "!bg-risk-fg !text-white !border-risk-fg hover:!opacity-90" : ""}>{s.confirmLabel ?? "Confirm"}</Btn></>}>
      {s.body && <div className="text-sm text-body">{s.body}</div>}
      {s.input && (
        <form className={s.body ? "mt-4" : ""} onSubmit={(e) => { e.preventDefault(); if (valid) close(val); }}>
          <Field label={s.input.label} hint={s.input.hint}><input data-autofocus type={s.input.type ?? "text"} minLength={s.input.minLength} className={inputCls} value={val} onChange={(e) => setVal(e.target.value)} autoComplete={s.input.type === "password" ? "new-password" : "off"} /></Field>
        </form>
      )}
    </Modal>
  );
}

/* --------------------------------- Menus --------------------------------- */
export function Menu({ trigger, children, align = "right", label, width = "w-56" }: { trigger: (p: { open: boolean; toggle: () => void; id: string }) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; label: string; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); (ref.current?.querySelector("[aria-haspopup]") as HTMLElement | null)?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []); if (!items.length) return;
        e.preventDefault(); const i = items.indexOf(document.activeElement as HTMLElement); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      }
    };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    setTimeout(() => (ref.current?.querySelector('[role="menuitem"]') as HTMLElement | null)?.focus(), 0);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && <div id={id} role="menu" aria-label={label} className={`a-pop absolute z-50 mt-2 ${width} ${align === "right" ? "right-0" : "left-0"} rounded-xl border border-line bg-surface p-1.5 shadow-[var(--a-shadow-pop)]`}>{children(() => setOpen(false))}</div>}
    </div>
  );
}
export function MenuItem({ icon: I, children, onClick, href, danger, hint, target }: { icon?: LucideIcon; children: ReactNode; onClick?: () => void; href?: string; danger?: boolean; hint?: string; target?: string }) {
  const cls = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus:bg-mist focus:outline-none hover:bg-mist ${danger ? "text-risk-fg" : "text-heading"}`;
  const inner = <>{I && <I size={16} className={danger ? "" : "text-muted"} aria-hidden="true" />}<span className="flex-1">{children}</span>{hint && <kbd className="text-xs text-muted">{hint}</kbd>}</>;
  if (href) return <a role="menuitem" tabIndex={-1} href={href} target={target} rel={target ? "noopener" : undefined} className={cls} onClick={onClick}>{inner}</a>;
  return <button role="menuitem" tabIndex={-1} type="button" className={cls} onClick={onClick}>{inner}</button>;
}
export const MenuSep = () => <div className="my-1 h-px bg-line" role="separator" />;

/* --------------------------------- Toasts --------------------------------- */
type ToastMsg = { id: number; text: string; tone: "ok" | "risk" | "info" };
const ToastCtx = createContext<(t: string, tone?: "ok" | "risk" | "info") => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function Toaster({ children, bind }: { children: ReactNode; bind?: (fn: (t: string, tone?: "ok" | "risk" | "info") => void) => void }) {
  const [list, setList] = useState<ToastMsg[]>([]);
  const push = useCallback((text: string, tone: "ok" | "risk" | "info" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-3), { id, text, tone }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), tone === "risk" ? 9000 : 5000);
  }, []);
  useEffect(() => { bind?.(push); }, [bind, push]);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {list.map((t) => {
          const I = t.tone === "ok" ? CheckCircle2 : t.tone === "risk" ? XCircle : Info;
          return (
            <div key={t.id} role={t.tone === "risk" ? "alert" : "status"} className="a-toast pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-sm text-heading shadow-[var(--a-shadow-pop)]">
              <I size={18} className={`mt-px shrink-0 ${t.tone === "ok" ? "text-ok-fg" : t.tone === "risk" ? "text-risk-fg" : "text-info-fg"}`} aria-hidden="true" />
              <p className="min-w-0 flex-1">{t.text}</p>
              <button type="button" className="text-muted hover:text-heading" aria-label="Dismiss" onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}><X size={15} /></button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------- Bilingual + JSON ------------------------------- */
/** Bilingual text input pair (EN required, NL optional). */
export function LInput({ label, value, onChange, area }: { label: string; value: any; onChange: (v: { en: string; nl?: string }) => void; area?: boolean }) {
  const v = value ?? { en: "", nl: "" };
  const C = area ? "textarea" : "input";
  return (
    <fieldset className="min-w-0 text-sm">
      <legend className="mb-1.5 font-medium text-heading">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block"><span className="mb-1 inline-flex rounded bg-mist px-1.5 text-[0.6875rem] font-semibold text-muted">EN</span><span className="sr-only">{label} (English)</span><C className={inputCls} rows={area ? 3 : undefined} value={v.en ?? ""} onChange={(e: any) => onChange({ ...v, en: e.target.value })} /></label>
        <label className="block"><span className="mb-1 inline-flex rounded bg-mist px-1.5 text-[0.6875rem] font-semibold text-muted">NL</span><span className="sr-only">{label} (Dutch)</span><C className={inputCls} rows={area ? 3 : undefined} value={v.nl ?? ""} onChange={(e: any) => onChange({ ...v, nl: e.target.value })} /></label>
      </div>
    </fieldset>
  );
}

/** JSON editor for advanced structures (options, conditions, triggers). */
export function JsonField({ label, value, onChange, hint, rows = 6 }: { label: string; value: unknown; onChange: (v: unknown, valid: boolean) => void; hint?: string; rows?: number }) {
  const [text, setText] = useState(() => (value === undefined || value === null ? "" : JSON.stringify(value, null, 2)));
  const [err, setErr] = useState<string | null>(null);
  return (
    <Field label={label} hint={hint} error={err}>
      <textarea className={`${inputCls} font-mono text-xs ${err ? "border-risk-fg" : ""}`} rows={rows} value={text} spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value.trim()) { setErr(null); onChange(undefined, true); return; }
          try { onChange(JSON.parse(e.target.value), true); setErr(null); } catch { setErr("Invalid JSON"); onChange(undefined, false); }
        }} />
    </Field>
  );
}

/** Definition list row used on detail pages. */
export const DL = ({ rows }: { rows: [ReactNode, ReactNode][] }) => (
  <dl className="divide-y divide-line text-sm">
    {rows.map(([k, v], i) => <div key={i} className="grid grid-cols-[minmax(7rem,38%)_minmax(0,1fr)] gap-3 py-2"><dt className="text-muted">{k}</dt><dd className="break-words text-heading">{v === null || v === undefined || v === "" ? <span className="text-muted">–</span> : v}</dd></div>)}
  </dl>
);
