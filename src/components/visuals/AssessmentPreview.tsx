"use client";

import catalog from "@/lib/assessment-catalog.json";
import { useT } from "@/components/SiteData";

const keys = catalog.templates[0].categories.map((c) => ({ id: c.key, en: c.name.en }));

// Illustrative values only, used to show what the results view looks like.
const example = [78, 44, 67, 33, 56, 22, 61];
const color = (v: number) => (v >= 60 ? "var(--color-signal)" : v >= 35 ? "var(--color-azure)" : "var(--color-brand-300)");

export default function AssessmentPreview() {
  const { t, locale } = useT();
  const categories = keys.map((c) => ({ id: c.id, short: t.pvDomains[c.id] ?? c.en }));
  return (
    <figure className="relative rounded-[var(--radius-md)] border border-ink-700 bg-ink-900 shadow-[var(--shadow-overlay)] overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-ink-700">
        <span className="t-eyebrow text-ink-300">{t.pvTitle}</span>
        <span className="t-mono text-[0.6875rem] uppercase tracking-widest text-ink-300 border border-ink-700 rounded-[var(--radius-xs)] px-2 py-0.5">
          {locale === "nl" ? "Voorbeeld" : "Illustrative example"}
        </span>
      </div>
      <div className="p-5 sm:p-6 grid gap-6 sm:grid-cols-[9rem_minmax(0,1fr)] items-center">
        <div className="flex sm:flex-col items-center gap-4 sm:gap-2">
          <svg viewBox="0 0 120 120" className="w-24 sm:w-32 shrink-0" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-ink-700)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none" stroke="var(--color-azure)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(46 / 100) * 314} 314`} transform="rotate(-90 60 60)"
            />
            <text x="60" y="58" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700" className="font-[family-name:var(--font-display)]">46</text>
            <text x="60" y="76" textAnchor="middle" fill="var(--color-ink-300)" fontSize="9" letterSpacing="1.5" className="font-[family-name:var(--font-mono)]">{t.pvLevel}</text>
          </svg>
          <p className="text-sm text-ink-300 sm:text-center">{t.pvOverall}</p>
        </div>
        <ul className="space-y-3">
          {categories.map((c, i) => (
            <li key={c.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
              <span className="text-ink-200 truncate">{c.short}</span>
              <span className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
                <span className="block h-full rounded-full" style={{ width: `${example[i]}%`, background: color(example[i]) }} />
              </span>
              <span className="t-mono text-xs text-ink-300 text-right">{example[i]}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="px-5 sm:px-6 py-3 border-t border-ink-700 text-xs text-ink-300">
        {t.pvCaption}
      </figcaption>
    </figure>
  );
}
