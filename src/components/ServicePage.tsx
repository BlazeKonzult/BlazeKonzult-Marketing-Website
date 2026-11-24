import Link from "@/components/LocalLink";
import { ArrowRight, Check } from "lucide-react";
import Button from "@/components/Button";
import PageHero from "@/components/PageHero";
import SectionIntro from "@/components/SectionIntro";
import IconRenderer from "@/components/IconRenderer";
import FAQAccordion from "@/components/FAQAccordion";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import LeadMagnetForm from "@/components/LeadMagnetForm";
import ServiceDiagram from "@/components/visuals/ServiceDiagram";
import type { ServiceContent } from "@/lib/serviceContent";
import { getDoc } from "@/content/server";
import { getCatalog, serviceLookup, getUi } from "@/content/catalog";
import type { Ui } from "@/content/ui";
import type { ServiceDoc } from "@/content/defaults";
import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

function Regulatory({ c, tone, t }: { c: ServiceContent; tone: "dark" | "light"; t: Ui }) {
  const dark = tone === "dark";
  return (
    <section className={`section ${dark ? "on-dark surface-dark relative overflow-hidden" : "bg-white border-y border-line"}`}>
      {dark && <div aria-hidden="true" className="absolute inset-0 bg-grid-dark opacity-60 [mask-image:linear-gradient(to_right,transparent,black)]" />}
      <div className="container-page relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <SectionIntro tone={tone} eyebrow={t.svcRegulatory} title={c.regulatory.title} lead={c.regulatory.body} />
        <ul className={`border-t ${dark ? "border-ink-700" : "border-line"}`}>
          {c.regulatory.points.map((p, i) => (
            <li key={p} className={`flex gap-5 py-5 border-b ${dark ? "border-ink-700 text-ink-200" : "border-line text-body"}`}>
              <span className={`t-mono text-xs pt-1 w-6 shrink-0 ${dark ? "text-brand-300" : "text-brand"}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function load(slug: string) {
  const doc = await getDoc<ServiceDoc>(`service:${slug}`);
  const { card: _card, seo, ...rest } = doc;
  const c: ServiceContent = { ...rest, slug, metaTitle: seo.title, metaDescription: seo.description } as ServiceContent;
  return { c, doc };
}

export async function serviceMetadata(slug: string): Promise<Metadata> {
  const { c } = await load(slug);
  return { title: c.metaTitle, description: c.metaDescription, alternates: await alternates(`/${slug}`) };
}

export default async function ServicePage({ slug }: { slug: string }) {
  const [{ c }, catalog, t] = await Promise.all([load(slug), getCatalog(), getUi()]);
  const find = serviceLookup(catalog.services);
  const serviceBySlug = (s: string) => find(s)!;
  const service = serviceBySlug(slug);
  const regulationFirst = c.visual === "regulation";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: c.metaDescription,
    provider: { "@type": "ProfessionalService", name: catalog.site.company.name, url: siteUrl },
    areaServed: "NL",
    url: `${siteUrl}${service.href}`,
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Services", item: `${siteUrl}/services/` },
      { "@type": "ListItem", position: 3, name: service.name, item: `${siteUrl}${service.href}/` },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.services, href: "/services" }, { label: service.name }]}
        eyebrow={c.eyebrow}
        title={c.title}
        description={c.lead}
        aside={<ServiceDiagram visual={c.visual} />}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <Button href="/contact" size="lg" arrow>{c.primaryCta}</Button>
          <Button href="/cybersecurity-assessment/" size="lg" variant="inverse">{t.svcCheckReadiness}</Button>
        </div>
      </PageHero>

      {/* Value proposition */}
      <section className="section bg-paper">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <p className="t-eyebrow text-brand">{t.svcValue}</p>
            <h2 className="t-h2 mt-4">{c.valueProp.title}</h2>
            <p className="t-lead mt-6 text-body">{c.valueProp.body}</p>
          </div>
          <aside className="self-start border-l-2 border-brand pl-6 lg:mt-12">
            <p className="t-eyebrow text-muted">{t.svcBestFor}</p>
            <p className="mt-3 text-heading font-medium leading-relaxed">{c.bestFor}</p>
            <p className="t-eyebrow text-muted mt-8">{t.svcOutcomes}</p>
            <ul className="mt-3 space-y-2.5">
              {c.benefits.map((b) => (
                <li key={b} className="flex gap-3 text-body">
                  <Check size={18} className="text-ok shrink-0 mt-0.5" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {regulationFirst && <Regulatory t={t} c={c} tone="dark" />}

      {/* Problems */}
      <section className={`section ${regulationFirst ? "bg-paper" : "bg-white border-y border-line"}`}>
        <div className="container-page">
          <SectionIntro eyebrow={t.svcProblemsEyebrow} title={t.svcProblemsTitle} />
          <ol className="mt-12 grid gap-x-10 md:grid-cols-3">
            {c.problems.map((p, i) => (
              <li key={p.title} className="reveal border-t-2 border-heading pt-6 pb-8">
                <span className="t-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-h3 mt-3">{p.title}</h3>
                <p className="mt-2 text-body leading-relaxed">{p.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Deliverables */}
      <section className={`section ${regulationFirst ? "bg-white border-y border-line" : "bg-paper"}`}>
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)] lg:gap-16">
          <SectionIntro eyebrow={t.svcDeliverablesEyebrow} title={t.svcDeliverablesTitle} lead={t.svcDeliverablesLead} />
          <ul className="grid gap-px sm:grid-cols-2 bg-line border border-line rounded-[var(--radius-md)] overflow-hidden">
            {c.deliverables.map((d) => (
              <li key={d.title} className="bg-white p-7">
                <IconRenderer name={d.icon} size={24} className="text-brand" />
                <h3 className="t-h3 mt-5 text-[1.125rem]">{d.title}</h3>
                <p className="mt-2 text-body leading-relaxed text-[0.9375rem]">{d.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Optional: sample roadmap */}
      {c.roadmap && (
        <section className="section bg-white border-y border-line">
          <div className="container-page">
            <SectionIntro eyebrow={t.svcExampleEyebrow} title={t.svcExampleTitle} lead={t.svcExampleLead} />
            <ol className="mt-12 grid md:grid-cols-3 border border-line rounded-[var(--radius-md)] overflow-hidden">
              {c.roadmap.map((r, i) => (
                <li key={r.phase} className={`p-7 ${i < 2 ? "border-b md:border-b-0 md:border-r border-line" : ""} ${i === 0 ? "bg-ink-950 text-ink-200" : "bg-white"}`}>
                  <p className={`t-mono text-sm ${i === 0 ? "text-brand-300" : "text-brand"}`}>{r.phase}</p>
                  <p className={`mt-3 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug ${i === 0 ? "text-white" : "text-heading"}`}>{r.focus}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Optional: tiers */}
      {c.tiers && (
        <section className="section bg-white border-y border-line">
          <div className="container-page">
            <SectionIntro
              eyebrow={t.svcLevelsEyebrow}
              title={t.svcLevelsTitle}
              lead={t.svcLevelsLead}
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {c.tiers.map((tier, i) => (
                <div key={tier.name} className={`rounded-[var(--radius-md)] p-7 sm:p-8 flex flex-col ${i === 1 ? "on-dark surface-dark" : "border border-line bg-paper"}`}>
                  <p className={`t-eyebrow ${i === 1 ? "text-brand-300" : "text-brand"}`}>{t.svcLevel} {i + 1}</p>
                  <h3 className="t-h3 mt-3 text-[1.5rem]">{tier.name}</h3>
                  <p className={`mt-2 ${i === 1 ? "text-ink-300" : "text-body"}`}>{tier.description}</p>
                  <ul className="mt-6 space-y-2.5 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className={`flex gap-3 text-[0.9375rem] ${i === 1 ? "text-ink-200" : "text-body"}`}>
                        <Check size={17} className={`${i === 1 ? "text-signal" : "text-ok"} shrink-0 mt-0.5`} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button href="/contact" variant={i === 1 ? "light" : "secondary"} className="mt-auto self-start">{t.svcRequestProposal}</Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Method */}
      <section className="section bg-paper">
        <div className="container-page">
          <SectionIntro eyebrow={t.svcEngagementEyebrow} title={t.svcEngagementTitle} />
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {c.method.map((m, i) => (
              <li key={m.title} className="reveal relative">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-full border border-heading/20 t-mono text-xs text-heading">{i + 1}</span>
                  {i < c.method.length - 1 && <span aria-hidden="true" className="hidden lg:block h-px flex-1 bg-line" />}
                </div>
                <h3 className="t-h3 mt-5 text-[1.125rem]">{m.title}</h3>
                <p className="mt-2 text-body leading-relaxed text-[0.9375rem]">{m.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {!regulationFirst && <Regulatory t={t} c={c} tone="dark" />}

      {/* Optional: checklist */}
      {c.checklist && (
        <section id="checklist" className="section bg-mist scroll-mt-24">
          <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
            <SectionIntro eyebrow={t.svcFreeResource} title={c.checklist.name} lead={c.checklist.description} />
            <LeadMagnetForm resourceName={c.checklist.name} buttonLabel={t.svcRequestChecklist} />
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section bg-white border-y border-line">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-20">
          <SectionIntro eyebrow={t.svcFaqEyebrow} title={t.svcFaqTitle} />
          <FAQAccordion items={c.faqs} />
        </div>
      </section>

      {/* Related */}
      <section className="section-tight bg-paper">
        <div className="container-page">
          <p className="t-eyebrow text-muted">{t.svcRelated}</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {c.related.filter((x) => find(x)).map((slug) => {
              const r = serviceBySlug(slug);
              return (
                <li key={slug}>
                  <Link href={r.href} className="group flex h-full flex-col rounded-[var(--radius-md)] border border-line bg-white p-6 transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-[var(--shadow-raised)]">
                    <IconRenderer name={r.icon} size={22} className="text-brand" />
                    <h3 className="t-h3 mt-4 text-[1.125rem] group-hover:text-brand transition-colors">{r.name}</h3>
                    <p className="mt-2 text-sm text-body leading-relaxed">{r.outcome}</p>
                    <span className="arrow-link mt-auto pt-5 text-sm text-cobalt">
                      {t.learnMore} <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <CtaBand title={c.closing.title} body={c.closing.body} primary={{ label: c.primaryCta, href: "/contact" }} />
    </>
  );
}
