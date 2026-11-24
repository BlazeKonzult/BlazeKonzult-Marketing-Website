"use client";

import Link from "@/components/LocalLink";
import { useT } from "@/components/SiteData";
import { type ReactNode } from "react";

type Crumb = { label: string; href?: string };

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  children?: ReactNode;
  aside?: ReactNode;
};

/** Dark page hero used on every inner page. The optional aside holds a page-specific visual. */
export default function PageHero({ eyebrow, title, description, breadcrumbs, children, aside }: PageHeroProps) {
  const { t } = useT();
  return (
    <section className="on-dark surface-dark relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-grid-dark [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(109_59_234/0.28),transparent)]"
      />
      <div className={`container-page relative pt-[calc(var(--header-h)+3.5rem)] pb-16 sm:pb-20 ${aside ? "grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center" : ""}`}>
        <div className="max-w-3xl">
          {breadcrumbs && (
            <nav aria-label={t.breadcrumb} className="mb-6">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-300">
                {breadcrumbs.map((c, i) => (
                  <li key={c.label} className="flex items-center gap-2">
                    {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span aria-current="page" className="text-ink-200">{c.label}</span>}
                    {i < breadcrumbs.length - 1 && <span aria-hidden="true" className="text-ink-600">/</span>}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {eyebrow && <p className="t-eyebrow text-brand-300 hero-enter">{eyebrow}</p>}
          <h1 className="t-h1 mt-4 hero-enter-2">{title}</h1>
          {description && <div className="t-lead mt-6 text-ink-300 max-w-2xl hero-enter-3">{description}</div>}
          {children && <div className="mt-9 hero-enter-3">{children}</div>}
        </div>
        {aside && <div className="hero-enter-3">{aside}</div>}
      </div>
    </section>
  );
}
