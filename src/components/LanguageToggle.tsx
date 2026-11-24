"use client";

import { usePathname } from "next/navigation";
import { useSite } from "@/components/SiteData";
import { switchLocalePath } from "@/lib/locale";

/** EN | NL switch. Opens the same page in the other language, keeping query and hash (e.g. assessment results). */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, t } = useSite();
  const pathname = usePathname() ?? "/";
  const other = switchLocalePath(pathname).path;
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.assign(other + window.location.search + window.location.hash);
  };
  const item = "inline-flex items-center justify-center h-8 min-w-9 px-2 rounded-[calc(var(--radius-sm)-2px)] text-[0.8125rem] font-semibold tracking-wide transition-colors";
  const langs = [{ code: "en", label: "EN", name: "English" }, { code: "nl", label: "NL", name: "Nederlands" }] as const;
  return (
    <div role="group" aria-label={t.language} className={`inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-white/20 p-0.5 ${className}`}>
      {langs.map((l) =>
        l.code === locale ? (
          <span key={l.code} lang={l.code} aria-current="true" title={l.name} className={`${item} bg-white text-ink-950`}>
            {l.label}<span className="sr-only"> {l.name}</span>
          </span>
        ) : (
          <a key={l.code} href={other} onClick={go} lang={l.code} hrefLang={l.code} title={l.name} className={`${item} text-ink-200 hover:text-white hover:bg-white/10`}>
            {l.label}<span className="sr-only"> {l.name}</span>
          </a>
        ),
      )}
    </div>
  );
}
