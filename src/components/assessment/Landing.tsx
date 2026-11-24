import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, LockKeyhole, Users } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import JsonLd from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";
import { bySlug, catalog } from "@/lib/assessment/catalog";
import { fmt, paths, pick, strings, type Locale } from "@/lib/assessment/i18n";

export default function Landing({ locale, slug }: { locale: Locale; slug: string }) {
  const x = bySlug(slug);
  if (!x) notFound();
  const t = strings[locale];
  const P = (v: Parameters<typeof pick>[0]) => pick(v, locale);
  return (
    <div lang={locale}>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: t.hub_title, item: `${siteUrl}${paths.hub(locale)}` },
        { "@type": "ListItem", position: 3, name: P(x.name), item: `${siteUrl}${paths.landing(locale, slug)}` },
      ] }} />
      <PageHero breadcrumbs={[{ label: "Home", href: "/" }, { label: t.hub_eyebrow, href: paths.hub(locale) }, { label: P(x.name) }]}
        eyebrow={t.hub_eyebrow} title={P(x.name)} description={P(x.summary)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href={paths.start(locale, slug)} size="lg" arrow>{t.landing_cta}</Button>
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-300">
          <span className="flex items-center gap-2"><Clock size={16} aria-hidden="true" /> {fmt(t.minutes, x.minutes)} · {fmt(t.questions_n, x.questions)}</span>
          <span className="flex items-center gap-2"><LockKeyhole size={16} aria-hidden="true" /> {locale === "nl" ? "Resultaten zonder contactgegevens" : "Results without contact details"}</span>
        </p>
      </PageHero>
      <section className="section bg-paper">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-[var(--radius-md)] border border-line bg-white p-6 sm:p-8">
            <h2 className="t-h3">{t.evaluates}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {x.evaluates.map((e) => <li key={e.en} className="flex gap-3 text-body"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />{P(e)}</li>)}
            </ul>
            <h2 className="t-h3 mt-10">{locale === "nl" ? "Domeinen in deze scan" : "Domains covered"}</h2>
            <dl className="mt-5 space-y-4">
              {x.categories.map((c) => <div key={c.key}><dt className="font-semibold text-heading">{P(c.name)}</dt>{c.description && <dd className="mt-0.5 text-sm text-body">{P(c.description)}</dd>}</div>)}
            </dl>
          </div>
          <div className="space-y-6">
            <div className="rounded-[var(--radius-md)] border border-line bg-white p-6">
              <h2 className="t-h3 flex items-center gap-2"><Users size={20} className="text-brand" aria-hidden="true" /> {t.who_for}</h2>
              <p className="mt-3 text-body">{P(x.audience)}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-line bg-white p-6">
              <h2 className="t-h3">{t.limits_title}</h2>
              <p className="mt-3 text-sm text-body">{t.limits_body}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-line bg-white p-6">
              <h2 className="t-h3">{t.other_assessments}</h2>
              <ul className="mt-3 space-y-2">
                {catalog.filter((o) => o.slug !== slug).map((o) => <li key={o.slug}><a href={paths.landing(locale, o.slug)} className="arrow-link link text-sm">{P(o.name)} <ArrowRight size={14} aria-hidden="true" /></a></li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
