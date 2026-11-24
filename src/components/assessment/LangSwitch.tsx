"use client";
import { Languages } from "lucide-react";
import { strings, type Locale } from "@/lib/assessment/i18n";

/** Switches between the English and Dutch version of the current assessment page, keeping query and hash. */
export default function LangSwitch({ locale, href }: { locale: Locale; href: string }) {
  const t = strings[locale];
  return (
    <a href={href} hrefLang={locale === "en" ? "nl" : "en"} lang={locale === "en" ? "nl" : "en"} aria-label={t.lang_switch_href_label}
      onClick={(e) => { if (typeof window !== "undefined" && (window.location.search || window.location.hash)) { e.preventDefault(); window.location.assign(href.split(/[?#]/)[0] + window.location.search + window.location.hash); } }}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-current/25 px-4 text-sm font-semibold opacity-90 hover:opacity-100">
      <Languages size={16} aria-hidden="true" /> {t.lang_switch}
    </a>
  );
}
