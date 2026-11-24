"use client";

/** Reusable data table: server-side sorting/pagination, column visibility, row selection with bulk actions, skeleton and empty states, mobile card layout. */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3 } from "lucide-react";
import { Menu, Skeleton } from "./ui";

export type Column<T> = { key: string; header: string; render: (row: T) => ReactNode; sort?: string; hideable?: boolean; hidden?: boolean; className?: string; mobile?: "title" | "meta" | "hide" };
export type Sort = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T extends { id: number | string }>({ id, columns, rows, loading, sort, onSort, selectable, selected, onSelect, bulk, empty, caption, rowHref }: {
  id: string; columns: Column<T>[]; rows: T[] | null; loading?: boolean; sort?: Sort; onSort?: (s: Sort) => void;
  selectable?: boolean; selected?: (number | string)[]; onSelect?: (ids: (number | string)[]) => void; bulk?: ReactNode; empty: ReactNode; caption: string; rowHref?: (row: T) => string;
}) {
  const storeKey = `bk-admin-cols-${id}`;
  const [hidden, setHidden] = useState<string[]>(() => columns.filter((c) => c.hidden).map((c) => c.key));
  // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the remembered column choice
  useEffect(() => { try { const v = localStorage.getItem(storeKey); if (v) setHidden(JSON.parse(v)); } catch { /* ignore */ } }, [storeKey]);
  const setHide = (k: string) => setHidden((h) => { const n = h.includes(k) ? h.filter((x) => x !== k) : [...h, k]; try { localStorage.setItem(storeKey, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const cols = columns.filter((c) => !hidden.includes(c.key));
  const sel = selected ?? [];
  const allOn = !!rows?.length && rows.every((r) => sel.includes(r.id));
  const toggleAll = () => onSelect?.(allOn ? sel.filter((x) => !rows!.some((r) => r.id === x)) : [...new Set([...sel, ...(rows ?? []).map((r) => r.id)])]);
  const toggle = (rid: number | string) => onSelect?.(sel.includes(rid) ? sel.filter((x) => x !== rid) : [...sel, rid]);
  const sortBtn = (c: Column<T>) => {
    if (!c.sort || !onSort) return c.header;
    const on = sort?.key === c.sort;
    const next: Sort = !on ? { key: c.sort, dir: "asc" } : sort!.dir === "asc" ? { key: c.sort, dir: "desc" } : null;
    return <button type="button" onClick={() => onSort(next)} className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-heading">{c.header}{on ? (sort!.dir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-40" />}</button>;
  };
  const hideable = columns.filter((c) => c.hideable);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--a-shadow-card)]">
      {(selectable && sel.length > 0) || hideable.length ? (
        <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          {selectable && sel.length > 0 ? <><span className="tnum text-sm font-medium text-heading">{sel.length} selected</span><button type="button" className="text-xs text-cobalt hover:underline" onClick={() => onSelect?.([])}>Clear</button><div className="flex flex-wrap items-center gap-2">{bulk}</div></>
            : <span className="text-[0.8125rem] text-muted">{rows ? `${rows.length} shown` : ""}</span>}
          {hideable.length > 0 && <div className="ml-auto"><Menu label="Columns" width="w-56" trigger={({ open, toggle: t, id: mid }) => (
            <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? mid : undefined} onClick={t} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] font-medium text-muted hover:bg-mist hover:text-heading"><Columns3 size={15} aria-hidden="true" />Columns</button>
          )}>{() => hideable.map((c) => (
            <label key={c.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-heading hover:bg-mist"><input role="menuitemcheckbox" aria-checked={!hidden.includes(c.key)} type="checkbox" className="check !mt-0" checked={!hidden.includes(c.key)} onChange={() => setHide(c.key)} />{c.header}</label>
          ))}</Menu></div>}
        </div>
      ) : null}
      {/* Desktop table */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-surface-2 text-xs font-medium text-muted">
            <tr>
              {selectable && <th scope="col" className="w-10 px-3 py-2.5"><input type="checkbox" className="check !mt-0" aria-label="Select all rows on this page" checked={allOn} onChange={toggleAll} /></th>}
              {cols.map((c) => <th key={c.key} scope="col" aria-sort={c.sort && sort?.key === c.sort ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined} className={`whitespace-nowrap px-4 py-2.5 font-medium ${c.className ?? ""}`}>{sortBtn(c)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(loading || !rows) ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{selectable && <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>}{cols.map((c) => <td key={c.key} className="px-4 py-3"><Skeleton className="h-4 w-[70%]" /></td>)}</tr>)
              : rows.map((r) => (
                <tr key={r.id} className={`transition-colors hover:bg-surface-2 ${sel.includes(r.id) ? "bg-brand-50/60" : ""}`}>
                  {selectable && <td className="px-3 py-3"><input type="checkbox" className="check !mt-0" aria-label="Select row" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} /></td>}
                  {cols.map((c) => <td key={c.key} className={`px-4 py-3 align-middle text-body ${c.className ?? ""}`}>{c.render(r)}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {(loading || !rows) ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="space-y-2 p-4"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></li>) : rows.map((r) => {
          const title = columns.find((c) => c.mobile === "title") ?? columns[0];
          const metas = cols.filter((c) => c !== title && c.mobile !== "hide");
          return (
            <li key={r.id} className="flex gap-3 p-4">
              {selectable && <input type="checkbox" className="check" aria-label="Select row" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} />}
              <div className="min-w-0 flex-1">
                <div className="text-sm">{title.render(r)}</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">{metas.map((c) => <div key={c.key} className="min-w-0"><dt className="text-muted">{c.header}</dt><dd className="truncate text-body">{c.render(r)}</dd></div>)}</dl>
                {rowHref && <a href={rowHref(r)} className="mt-2 inline-block text-xs font-medium text-cobalt">Open</a>}
              </div>
            </li>
          );
        })}
      </ul>
      {rows && !loading && rows.length === 0 && <div className="border-t border-line">{empty}</div>}
    </div>
  );
}
