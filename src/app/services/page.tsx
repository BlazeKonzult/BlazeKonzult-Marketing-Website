import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import Link from "@/components/LocalLink";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Button from "@/components/Button";
import PageHero from "@/components/PageHero";
import SectionIntro from "@/components/SectionIntro";
import IconRenderer from "@/components/IconRenderer";
import CtaBand from "@/components/CtaBand";
import { getDoc } from "@/content/server";
import { getCatalog, serviceLookup, getUi } from "@/content/catalog";
import type { ServicesPageDoc } from "@/content/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getDoc<ServicesPageDoc>("page:services");
  return { title: c.seo.title, description: c.seo.description, alternates: await alternates("/services") };
}

export default async function ServicesPage() {
  const t = await getUi();
  const [c, catalog] = await Promise.all([getDoc<ServicesPageDoc>("page:services"), getCatalog()]);
  const { services, serviceGroups } = catalog;
  const find = serviceLookup(services);
  const serviceBySlug = (slug: string) => find(slug)!;
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.services }]}
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        description={c.hero.description}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <Button href={c.hero.primary.href} size="lg" arrow>{c.hero.primary.label}</Button>
          <Button href={c.hero.secondary.href} size="lg" variant="inverse">{c.hero.secondary.label}</Button>
        </div>
      </PageHero>

      {serviceGroups.map((group, gi) => (
        <section key={group.label} className={`section ${gi % 2 ? "bg-white border-y border-line" : "bg-paper"}`}>
          <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="t-mono text-sm text-muted">{String(gi + 1).padStart(2, "0")} / {String(serviceGroups.length).padStart(2, "0")}</p>
              <SectionIntro title={group.label.replace(/^./, (c) => c.toUpperCase()) + "."} lead={group.description} className="mt-2" />
            </div>
            <ul className="border-t border-line">
              {group.slugs.filter((x) => find(x)).map((slug) => {
                const s = serviceBySlug(slug);
                return (
                  <li key={slug} className="reveal border-b border-line">
                    <Link href={s.href} className="group grid gap-5 py-8 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
                      <IconRenderer name={s.icon} size={26} className="text-brand mt-1" />
                      <div>
                        <h3 className="t-h3 text-[1.375rem] group-hover:text-brand transition-colors">{s.name}</h3>
                        <p className="mt-2 text-body leading-relaxed max-w-2xl">{s.shortDescription}</p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {s.deliverables.map((d) => (
                            <li key={d} className="text-xs font-medium text-heading bg-mist border border-line rounded-[var(--radius-xs)] px-2.5 py-1">
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span className="hidden sm:grid place-items-center w-11 h-11 rounded-full border border-line text-heading transition-colors group-hover:bg-brand group-hover:border-brand group-hover:text-white">
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      {/* Comparison */}
      <section className="section bg-paper">
        <div className="container-page">
          <SectionIntro eyebrow={c.compare.eyebrow} title={c.compare.title} />
          <div className="mt-10 overflow-x-auto rounded-[var(--radius-md)] border border-line bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">Comparison of BlazeKonzult services by who they suit and the outcome</caption>
              <thead>
                <tr className="border-b border-line bg-mist">
                  <th scope="col" className="py-4 px-5 t-eyebrow text-muted font-medium">{c.compare.serviceLabel}</th>
                  <th scope="col" className="py-4 px-5 t-eyebrow text-muted font-medium">{c.compare.bestForLabel}</th>
                  <th scope="col" className="py-4 px-5 t-eyebrow text-muted font-medium">{c.compare.outcomeLabel}</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.slug} className="border-b border-line last:border-0 align-top">
                    <th scope="row" className="py-5 px-5 font-semibold text-heading">
                      <Link href={s.href} className="hover:text-brand inline-flex items-center gap-1.5">
                        {s.name} <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </th>
                    <td className="py-5 px-5 text-[0.9375rem] text-body">{s.bestSuitedFor}</td>
                    <td className="py-5 px-5 text-[0.9375rem] text-body">{s.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CtaBand title={c.closing.title} body={c.closing.body} primary={c.closing.primary} secondary={c.closing.secondary} />
    </>
  );
}
