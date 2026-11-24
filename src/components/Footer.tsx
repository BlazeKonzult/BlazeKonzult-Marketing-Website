"use client";

import Link from "@/components/LocalLink";
import Logo from "@/components/Logo";
import LinkedinIcon from "@/components/LinkedinIcon";
import { useSite } from "@/components/SiteData";

export default function Footer() {
  const { industries, serviceBySlug, serviceGroups, site, t } = useSite();
  const companyInfo = site.company;
  const f = site.footer;
  const services = serviceGroups.flatMap((g) => g.slugs.map(serviceBySlug));
  const year = new Date().getFullYear();

  const col = "t-eyebrow text-ink-300 mb-4";
  const link = "text-[0.9375rem] text-ink-200 hover:text-white transition-colors";

  return (
    <footer className="on-dark surface-dark border-t border-ink-700">
      <div className="container-page pt-16 sm:pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-300">
              {f.blurb}
            </p>
            <p className="mt-4 text-sm text-ink-300">{companyInfo.serviceArea}.</p>
            <a
              href={companyInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm text-ink-200 hover:text-white"
            >
              <span className="grid place-items-center w-9 h-9 rounded-[var(--radius-sm)] border border-ink-700">
                <LinkedinIcon size={16} />
              </span>
              LinkedIn
            </a>
          </div>

          <div>
            <h2 className={col}>{t.services}</h2>
            <ul className="space-y-2.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={s.href} className={link}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={col}>{t.industries}</h2>
            <ul className="space-y-2.5">
              {industries.map((i) => (
                <li key={i.slug}>
                  <Link href={`/industries#${i.slug}`} className={link}>{i.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={col}>{t.resources}</h2>
            <ul className="space-y-2.5">
              {f.resourceLinks.map((l) => <li key={l.label}><Link href={l.href} className={link}>{l.label}</Link></li>)}
            </ul>
          </div>

          <div>
            <h2 className={col}>{t.company}</h2>
            <ul className="space-y-2.5">
              {f.companyLinks.map((l) => <li key={l.label}><Link href={l.href} className={link}>{l.label}</Link></li>)}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-ink-700 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-ink-300">
          <p>© {year} {f.copyright}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {f.legalLinks.map((l) => <li key={l.label}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
