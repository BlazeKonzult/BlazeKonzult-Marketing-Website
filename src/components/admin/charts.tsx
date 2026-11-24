"use client";

/**
 * Lightweight SVG charts (no chart library): time series with crosshair tooltip, legend toggles,
 * a data table view and CSV export; sparklines; metric cards; labelled bar lists.
 * Palette (validated for CVD separation in light and dark): --a-chart-1..4 in globals.css.
 */
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Info, Minus, Table2, LineChart as LineIcon, type LucideIcon } from "lucide-react";
import { fmtNum, fmtPct } from "./lib";

export const SERIES_COLORS = ["var(--a-chart-1)", "var(--a-chart-2)", "var(--a-chart-3)", "var(--a-chart-4)"];

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const cell = (v: unknown) => { let s = v === null || v === undefined ? "" : String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const blob = new Blob(["﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Bucket label: 2026-11-24 → 24 Nov; 2026-11 → Nov 2026. */
export function bucketLabel(k: string, bucket: string) {
  if (bucket === "month") return new Date(k + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const d = new Date(k + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return bucket === "week" ? `Week of ${d}` : d;
}

/* ------------------------------- Sparkline ------------------------------- */
export function Sparkline({ values, color = SERIES_COLORS[0], label }: { values: number[]; color?: string; label: string }) {
  const id = useId();
  if (values.length < 2) return null;
  const w = 120, h = 32, max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none" role="img" aria-label={label}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.18" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------ Metric card ------------------------------ */
export type Delta = { kind: "count" | "rate"; cur: number | null; prev: number | null; hasHistory: boolean };
function change(d: Delta): { text: string; dir: "up" | "down" | "flat" | "none"; sr: string } {
  if (d.cur === null) return { text: "No data", dir: "none", sr: "No data for this period" };
  if (!d.hasHistory || d.prev === null) return { text: "No earlier data", dir: "none", sr: "No earlier data to compare with" };
  if (d.kind === "rate") {
    const diff = Math.round((d.cur - d.prev) * 10) / 10;
    if (diff === 0) return { text: "No change", dir: "flat", sr: "No change from the previous period" };
    return { text: `${diff > 0 ? "+" : ""}${diff} pts`, dir: diff > 0 ? "up" : "down", sr: `${Math.abs(diff)} percentage points ${diff > 0 ? "higher" : "lower"} than the previous period` };
  }
  if (d.prev === 0) return d.cur === 0 ? { text: "No change", dir: "flat", sr: "No change" } : { text: `+${d.cur} (none before)`, dir: "up", sr: `${d.cur} more; none in the previous period` };
  const p = Math.round(((d.cur - d.prev) / d.prev) * 1000) / 10;
  if (p === 0) return { text: "No change", dir: "flat", sr: "No change from the previous period" };
  return { text: `${p > 0 ? "+" : ""}${p}%`, dir: p > 0 ? "up" : "down", sr: `${Math.abs(p)}% ${p > 0 ? "higher" : "lower"} than the previous period (${d.prev})` };
}

export function MetricCard({ icon: I, label, value, delta, spark, help, href, sub, goodWhen = "up" }: { icon: LucideIcon; label: string; value: string; delta?: Delta; spark?: number[]; help?: string; href?: string; sub?: ReactNode; goodWhen?: "up" | "down" }) {
  const c = delta ? change(delta) : null;
  const good = c && c.dir !== "none" && c.dir !== "flat" ? (c.dir === goodWhen) : null;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted"><span className="grid h-7 w-7 place-items-center rounded-lg bg-mist text-body"><I size={15} aria-hidden="true" /></span>{label}</span>
        {help && <span className="group/tip relative" tabIndex={0} aria-label={`About ${label}: ${help}`}><Info size={14} className="text-muted/70" aria-hidden="true" />
          <span role="tooltip" className="pointer-events-none absolute right-0 top-5 z-20 w-60 rounded-lg bg-[#101828] p-2.5 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover/tip:opacity-100 group-focus/tip:opacity-100">{help}</span></span>}
      </div>
      <p className="tnum mt-3 text-[1.875rem] font-semibold leading-none tracking-[-0.02em] text-heading">{value}</p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {c && <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${good === true ? "bg-ok-bg text-ok-fg" : good === false ? "bg-risk-bg text-risk-fg" : "bg-mist text-muted"}`}>
          {c.dir === "up" ? <ArrowUpRight size={13} aria-hidden="true" /> : c.dir === "down" ? <ArrowDownRight size={13} aria-hidden="true" /> : c.dir === "flat" ? <Minus size={13} aria-hidden="true" /> : null}
          <span aria-hidden="true">{c.text}</span><span className="sr-only">{c.sr}</span>
        </span>}
        {c && c.dir !== "none" && <span className="text-muted">vs previous period</span>}
        {sub && <span className="text-muted">{sub}</span>}
      </div>
      {spark && spark.some((v) => v > 0) && <div className="mt-3"><Sparkline values={spark} label={`${label} trend`} /></div>}
    </>
  );
  const cls = "block rounded-xl border border-line bg-surface p-4 shadow-[var(--a-shadow-card)] transition-[border-color,box-shadow]";
  return href ? <a href={href} className={`${cls} hover:border-line-strong hover:shadow-[0_4px_12px_-4px_rgb(16_24_40/0.12)]`}>{inner}</a> : <div className={cls}>{inner}</div>;
}

/* ------------------------------ Time series ------------------------------ */
export type Series = { key: string; label: string; values: number[] };
export function LineChart({ keys, bucket, series, title, height = 260 }: { keys: string[]; bucket: string; series: Series[]; title: string; height?: number }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const shown = series.filter((s) => !hidden.includes(s.key));
  const max = useMemo(() => { const m = Math.max(0, ...shown.flatMap((s) => s.values)); if (m <= 4) return 4; const p = Math.pow(10, Math.floor(Math.log10(m))); return Math.ceil(m / p) * p; }, [shown]);
  const W = 800, H = height, padL = 36, padR = 12, padT = 12, padB = 28;
  const iw = W - padL - padR, ih = H - padT - padB;
  const x = (i: number) => padL + (keys.length <= 1 ? iw / 2 : (i / (keys.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const labelEvery = Math.max(1, Math.ceil(keys.length / 7));
  const total = (s: Series) => s.values.reduce((a, b) => a + b, 0);
  const empty = series.every((s) => total(s) === 0);
  const onMove = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - padL) / iw) * (keys.length - 1));
    setHover(Math.max(0, Math.min(keys.length - 1, i)));
  };
  const summary = `${title}. ${series.map((s) => `${s.label}: ${total(s)} in total`).join("; ")}.`;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Series (select to show or hide)">
          {series.map((s, i) => {
            const off = hidden.includes(s.key);
            return (
              <li key={s.key}><button type="button" aria-pressed={!off} onClick={() => setHidden((h) => off ? h.filter((k) => k !== s.key) : [...h, s.key])}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${off ? "border-line text-muted line-through" : "border-line-strong text-heading hover:bg-mist"}`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: off ? "transparent" : SERIES_COLORS[i], boxShadow: off ? `inset 0 0 0 1.5px ${SERIES_COLORS[i]}` : undefined }} aria-hidden="true" />
                {s.label}<span className="tnum text-muted">{fmtNum(total(s))}</span>
              </button></li>
            );
          })}
        </ul>
        <div className="flex gap-1">
          <button type="button" onClick={() => setTable(!table)} aria-pressed={table} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-mist hover:text-heading">{table ? <LineIcon size={14} aria-hidden="true" /> : <Table2 size={14} aria-hidden="true" />}{table ? "Chart" : "Table"}</button>
          <button type="button" onClick={() => downloadCsv(`${title.toLowerCase().replace(/\W+/g, "-")}.csv`, [["period", ...series.map((s) => s.label)], ...keys.map((k, i) => [k, ...series.map((s) => s.values[i])])])} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-mist hover:text-heading"><Download size={14} aria-hidden="true" />CSV</button>
        </div>
      </div>
      {table ? (
        <div className="max-h-[320px] overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm"><caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-surface-2 text-xs text-muted"><tr><th scope="col" className="px-3 py-2 text-left font-medium">Period</th>{series.map((s) => <th key={s.key} scope="col" className="px-3 py-2 text-right font-medium">{s.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{keys.map((k, i) => <tr key={k}><th scope="row" className="px-3 py-1.5 text-left font-normal text-body">{bucketLabel(k, bucket)}</th>{series.map((s) => <td key={s.key} className="px-3 py-1.5 text-right text-heading">{s.values[i]}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div ref={box} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-pan-y select-none" role="img" aria-label={summary}>
            {ticks.map((t) => <g key={t}><line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--a-chart-grid)" strokeWidth="1" /><text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)" className="tnum">{t}</text></g>)}
            {keys.map((k, i) => (i % labelEvery === 0 || i === keys.length - 1) && <text key={k} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === keys.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--color-muted)">{bucketLabel(k, bucket).replace("Week of ", "")}</text>)}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="var(--color-line-strong)" strokeWidth="1" strokeDasharray="3 3" />}
            {series.map((s, si) => hidden.includes(s.key) ? null : (
              <g key={s.key}>
                <path d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke={SERIES_COLORS[si]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {keys.length <= 31 && s.values.map((v, i) => v > 0 && <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : 2.5} fill={SERIES_COLORS[si]} stroke="var(--color-surface)" strokeWidth="2" />)}
                {hover !== null && keys.length > 31 && <circle cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={SERIES_COLORS[si]} stroke="var(--color-surface)" strokeWidth="2" />}
              </g>
            ))}
          </svg>
          {empty && <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">No activity recorded in this period.</p>}
          {hover !== null && !empty && (
            <div className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg border border-line bg-surface p-2.5 text-xs shadow-[var(--a-shadow-pop)]" style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% + 12px), calc(100% - 11rem))` }}>
              <p className="mb-1.5 font-semibold text-heading">{bucketLabel(keys[hover], bucket)}</p>
              {shown.map((s) => <p key={s.key} className="flex items-center justify-between gap-4"><span className="flex items-center gap-1.5 text-body"><span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[series.indexOf(s)] }} />{s.label}</span><span className="tnum font-semibold text-heading">{s.values[hover]}</span></p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Bar list -------------------------------- */
/** Horizontal labelled bars. Values are printed as text so colour is never the only cue. */
export function BarList({ rows, max, color = "var(--a-chart-1)", empty = "No data yet.", format }: { rows: { label: ReactNode; value: number; text?: string; href?: string; key: string }[]; max?: number; color?: string; empty?: ReactNode; format?: (v: number) => string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate text-heading">{r.label}</span><span className="tnum shrink-0 text-muted">{r.text ?? (format ? format(r.value) : fmtNum(r.value))}</span></div>
            <div className="mt-1.5 h-2 rounded-full bg-mist" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${r.value > 0 ? Math.max(2, (100 * r.value) / m) : 0}%`, background: color }} /></div>
          </>
        );
        return <li key={r.key}>{r.href ? <a href={r.href} className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-mist">{body}</a> : <div className="py-1.5">{body}</div>}</li>;
      })}
    </ul>
  );
}

/** Small circular score indicator with the number in the middle. */
export function ScoreRing({ value, size = 88, label }: { value: number | null; size?: number; label: string }) {
  const r = 34, c = 2 * Math.PI * r, v = value ?? 0;
  return (
    <svg viewBox="0 0 88 88" width={size} height={size} role="img" aria-label={`${label}: ${value === null ? "no data" : `${value} out of 100`}`}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-mist)" strokeWidth="8" />
      {value !== null && <circle cx="44" cy="44" r={r} fill="none" stroke="var(--a-chart-1)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} transform="rotate(-90 44 44)" />}
      <text x="44" y="49" textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--color-heading)" className="tnum">{value === null ? "–" : Math.round(v)}</text>
    </svg>
  );
}

export const pctText = fmtPct;
