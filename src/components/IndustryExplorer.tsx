"use client";

import Link from "@/components/LocalLink";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight } from "lucide-react";
import IconRenderer from "@/components/IconRenderer";
import { useSite } from "@/components/SiteData";

/** Tabbed industry explorer: one sector in focus at a time, with what differs about its risk. */
export default function IndustryExplorer() {
  const { industries, serviceBySlug, t } = useSite();
  const [active, setActive] = useState(0);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const ind = industries[active];

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + industries.length) % industries.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
      <div role="tablist" aria-label={t.indAria} aria-orientation="vertical" className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar -mx-[var(--gutter)] px-[var(--gutter)] lg:mx-0 lg:px-0">
        {industries.map((item, i) => {
          const selected = i === active;
          return (
            <button
              key={item.slug}
              ref={(el) => { tabs.current[i] = el; }}
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKey}
              className={`shrink-0 flex items-center gap-3 text-left rounded-[var(--radius-sm)] px-4 py-3 text-[0.9375rem] font-medium transition-colors border ${
                selected ? "bg-ink-950 text-white border-ink-950" : "text-body border-transparent hover:bg-white hover:border-line"
              }`}
            >
              <IconRenderer name={item.icon} size={18} className={selected ? "text-brand-300" : "text-muted"} />
              <span className="whitespace-nowrap lg:whitespace-normal">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${active}`}
        key={ind.slug}
        className="bg-white border border-line rounded-[var(--radius-md)] p-6 sm:p-9 motion-safe:animate-[hero-enter_0.4s_var(--ease-out-soft)_both]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h3 className="t-h3 text-[1.5rem]">{ind.name}</h3>
          <span className="t-mono text-xs text-muted border border-line rounded-[var(--radius-xs)] px-2 py-1">Depends on: {ind.dependsOn}</span>
        </div>
        <p className="mt-4 text-body leading-relaxed max-w-2xl">{ind.summary}</p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="t-eyebrow text-risk">{t.indRisk}</p>
            <ul className="mt-4 space-y-3">
              {ind.challenges.map((c) => (
                <li key={c} className="flex gap-3 text-[0.9375rem] text-body leading-snug">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-risk" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="t-eyebrow text-ok">{t.indPriorities}</p>
            <ul className="mt-4 space-y-3">
              {ind.priorities.map((p) => (
                <li key={p} className="flex gap-3 text-[0.9375rem] text-body leading-snug">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 border-l-2 border-brand pl-4 text-sm text-muted leading-relaxed">{ind.regulatory}</p>

        <div className="mt-8 pt-6 border-t border-line flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="t-eyebrow text-muted">{t.indServices}</span>
          {ind.services.map((slug) => {
            const s = serviceBySlug(slug);
            return (
              <Link key={slug} href={s.href} className="arrow-link text-sm text-cobalt hover:text-brand">
                {s.name} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
