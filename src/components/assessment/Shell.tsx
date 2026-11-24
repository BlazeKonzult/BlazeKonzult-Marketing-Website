import { type ReactNode } from "react";
import type { Locale } from "@/lib/assessment/i18n";

/** Compact dark band (keeps the fixed header legible) followed by the working area on a light surface. */
export default function Shell({ locale, eyebrow, title, children, narrow }: { locale: Locale; eyebrow: string; title: string; switchHref?: string; children: ReactNode; narrow?: boolean }) {
  return (
    <div lang={locale} className="bg-paper">
      <div className="on-dark surface-dark print:bg-white print:text-heading">
        <div className={`container-page flex flex-wrap items-end justify-between gap-4 pb-8 pt-[calc(var(--header-h)+1.75rem)] ${narrow ? "" : ""}`}>
          <div>
            <p className="t-eyebrow text-brand-300">{eyebrow}</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white sm:text-3xl print:text-heading">{title}</h1>
          </div>
        </div>
      </div>
      <section className="container-page pb-20 pt-10">{children}</section>
    </div>
  );
}
