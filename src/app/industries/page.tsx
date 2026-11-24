import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import Link from "@/components/LocalLink";
import { ArrowRight } from "lucide-react";
import Button from "@/components/Button";
import PageHero from "@/components/PageHero";
import IconRenderer from "@/components/IconRenderer";
import CtaBand from "@/components/CtaBand";
import { getDoc } from "@/content/server";
import { getCatalog, serviceLookup, getUi } from "@/content/catalog";
import type { IndustriesDoc } from "@/content/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getDoc<IndustriesDoc>("page:industries");
  return { title: c.seo.title, description: c.seo.description, alternates: await alternates("/industries") };
}

export default async function IndustriesPage() {
  const t = await getUi();
  const [c, catalog] = await Promise.all([getDoc<IndustriesDoc>("page:industries"), getCatalog()]);
  const industries = c.items;
  const find = serviceLookup(catalog.services);
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.industries }]}
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        description={c.hero.description}
      >
        <nav aria-label="Jump to industry">
          <ul className="flex flex-wrap gap-2">
            {industries.map((i) => (
              <li key={i.slug}>
                <a href={`#${i.slug}`} className="inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] border border-ink-700 text-sm text-ink-200 hover:text-white hover:border-ink-600">
                  <IconRenderer name={i.icon} size={15} className="text-brand-300" />
                  {i.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      {industries.map((ind, idx) => (
        <section key={ind.slug} id={ind.slug} className={`section scroll-mt-20 ${idx % 2 ? "bg-white border-y border-line" : "bg-paper"}`}>
          <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-[var(--radius-sm)] bg-ink-950 text-brand-300">
                  <IconRenderer name={ind.icon} size={22} />
                </span>
                <span className="t-mono text-sm text-muted">{String(idx + 1).padStart(2, "0")} / {String(industries.length).padStart(2, "0")}</span>
              </div>
              <h2 className="t-h2 mt-6">{ind.name}</h2>
              <p className="t-lead mt-5 text-body">{ind.summary}</p>
              <p className="mt-6 t-mono text-xs text-muted">{c.labels.dependsOn} {ind.dependsOn}</p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-px sm:grid-cols-2 bg-line border border-line rounded-[var(--radius-md)] overflow-hidden">
                <div className="bg-white p-6 sm:p-7">
                  <p className="t-eyebrow text-risk">{c.labels.risks}</p>
                  <ul className="mt-4 space-y-3">
                    {ind.challenges.map((c) => (
                      <li key={c} className="flex gap-3 text-[0.9375rem] text-body leading-snug">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-risk" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-6 sm:p-7">
                  <p className="t-eyebrow text-ok">{c.labels.priorities}</p>
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
              <p className="border-l-2 border-brand pl-4 text-[0.9375rem] text-body leading-relaxed">
                <span className="font-semibold text-heading">{c.labels.regulatory} </span>
                {ind.regulatory}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="t-eyebrow text-muted">{c.labels.services}</span>
                {ind.services.filter((x) => find(x)).map((slug) => {
                  const s = find(slug)!;
                  return (
                    <Link key={slug} href={s.href} className="arrow-link text-sm text-cobalt hover:text-brand">
                      {s.name} <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="section-tight bg-paper border-t border-line">
        <div className="container-page flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="t-h3 max-w-xl">{c.notListed.text}</p>
          <Button href={c.notListed.button.href} variant="secondary" arrow>{c.notListed.button.label}</Button>
        </div>
      </section>

      <CtaBand title={c.closing.title} body={c.closing.body} primary={c.closing.primary} secondary={c.closing.secondary} />
    </>
  );
}
