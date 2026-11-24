"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { call, type PublicTemplate } from "@/lib/assessment/api";
import { fmt, paths, strings, type Locale } from "@/lib/assessment/i18n";

/** Assessments published in the admin dashboard after the last site build (no static landing page yet). */
export default function LiveTemplates({ locale, known }: { locale: Locale; known: string[] }) {
  const t = strings[locale];
  const [extra, setExtra] = useState<PublicTemplate[]>([]);
  useEffect(() => {
    call<{ templates: PublicTemplate[] }>("GET", `/templates?locale=${locale}`).then((r) => setExtra(r.templates.filter((x) => !known.includes(x.slug)))).catch(() => {});
  }, [locale, known]);
  if (!extra.length) return null;
  return (
    <>
      {extra.map((x) => (
        <li key={x.slug} className="flex flex-col rounded-[var(--radius-md)] border border-line bg-white p-6">
          <h3 className="t-h3">{x.name}</h3>
          <p className="mt-2 flex-1 text-body">{x.summary}</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Clock size={15} aria-hidden="true" /> {fmt(t.minutes, x.minutes)} · {fmt(t.questions_n, x.questions)}</p>
          <a href={paths.start(locale, x.slug)} className="arrow-link link mt-5">{t.start} <ArrowRight size={16} aria-hidden="true" /></a>
        </li>
      ))}
    </>
  );
}
