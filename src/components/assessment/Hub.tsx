import { ArrowRight, CheckCircle2, ClipboardCheck, Clock, FileText, Gauge, LockKeyhole, Scale } from "lucide-react";
import PageHero from "@/components/PageHero";
import SectionIntro from "@/components/SectionIntro";
import FAQAccordion from "@/components/FAQAccordion";
import Button from "@/components/Button";
import JsonLd from "@/components/JsonLd";
import { siteUrl } from "@/lib/site";
import { catalog } from "@/lib/assessment/catalog";
import { fmt, paths, pick, strings, type Locale } from "@/lib/assessment/i18n";
import LiveTemplates from "./LiveTemplates";

export default function Hub({ locale }: { locale: Locale }) {
  const t = strings[locale];
  const sorted = [...catalog].sort((a, b) => a.sort - b.sort);
  return (
    <div lang={locale}>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: t.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: t.hub_title, url: `${siteUrl}${paths.hub(locale)}`, applicationCategory: "BusinessApplication", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, inLanguage: locale }} />
      <PageHero
        breadcrumbs={[{ label: locale === "nl" ? "Home" : "Home", href: "/" }, { label: t.hub_eyebrow }]}
        eyebrow={t.hub_eyebrow}
        title={t.hub_title}
        description={t.hub_lead}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button href={paths.start(locale, "general")} size="lg" arrow>{t.hub_start}</Button>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
          <li className="flex items-center gap-2"><Clock size={16} aria-hidden="true" /> 5–12 min</li>
          <li className="flex items-center gap-2"><LockKeyhole size={16} aria-hidden="true" /> {locale === "nl" ? "Geen account nodig" : "No account needed"}</li>
          <li className="flex items-center gap-2"><Gauge size={16} aria-hidden="true" /> {locale === "nl" ? "Direct resultaat" : "Instant results"}</li>
        </ul>
      </PageHero>

      <section className="section bg-paper" aria-labelledby="choose-h">
        <div className="container-page">
          <SectionIntro eyebrow={t.start} title={<span id="choose-h">{t.hub_choose}</span>} lead={t.hub_choose_lead} />
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sorted.map((x, i) => (
              <li key={x.slug} className={`flex flex-col rounded-[var(--radius-md)] border bg-white p-6 ${i === 0 ? "border-brand/40 shadow-[0_12px_30px_-18px_rgb(109_59_234/0.5)] lg:col-span-1" : "border-line"}`}>
                <h3 className="t-h3"><a href={paths.landing(locale, x.slug)} className="hover:text-brand">{pick(x.name, locale)}</a></h3>
                <p className="mt-2 flex-1 text-body">{pick(x.summary, locale)}</p>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Clock size={15} aria-hidden="true" /> {fmt(t.minutes, x.minutes)} · {fmt(t.questions_n, x.questions)}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href={paths.start(locale, x.slug)} className="arrow-link link">{t.start} <ArrowRight size={16} aria-hidden="true" /></a>
                  <a href={paths.landing(locale, x.slug)} className="text-sm text-muted underline-offset-4 hover:underline" aria-label={`${t.learn_more}: ${pick(x.name, locale)}`}>{t.learn_more}</a>
                </div>
              </li>
            ))}
            <LiveTemplates locale={locale} known={sorted.map((x) => x.slug)} />
          </ul>
        </div>
      </section>

      <section className="section bg-white" aria-labelledby="how-h">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="how-h" className="t-h2">{t.how_title}</h2>
            <ol className="mt-8 space-y-6">
              {[[ClipboardCheck, t.how_1_t, t.how_1_d], [Gauge, t.how_2_t, t.how_2_d], [FileText, t.how_3_t, t.how_3_d]].map(([Icon, title, d], i) => {
                const I = Icon as typeof Gauge;
                return (
                  <li key={i} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand"><I size={20} aria-hidden="true" /></span>
                    <div><h3 className="text-lg font-semibold text-heading">{i + 1}. {title as string}</h3><p className="mt-1 text-body">{d as string}</p></div>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="rounded-[var(--radius-md)] border border-line bg-paper p-6 sm:p-8">
            <h2 className="t-h3">{t.get_title}</h2>
            <ul className="mt-5 space-y-3">
              {[t.get_1, t.get_2, t.get_3, t.get_4, t.get_5].map((g) => <li key={g} className="flex gap-3 text-body"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ok" aria-hidden="true" />{g}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-tight bg-paper">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-line bg-white p-6 sm:p-8">
            <h2 className="t-h3 flex items-center gap-2"><LockKeyhole size={20} className="text-brand" aria-hidden="true" /> {t.privacy_title}</h2>
            <p className="mt-3 text-body">{t.privacy_body}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-line bg-white p-6 sm:p-8">
            <h2 className="t-h3 flex items-center gap-2"><Scale size={20} className="text-brand" aria-hidden="true" /> {t.limits_title}</h2>
            <p className="mt-3 text-body">{t.limits_body}</p>
          </div>
        </div>
      </section>

      <section className="section bg-white" aria-labelledby="faq-h">
        <div className="container-narrow">
          <h2 id="faq-h" className="t-h2">{t.faq_title}</h2>
          <div className="mt-8"><FAQAccordion items={t.faqs.map(([question, answer]) => ({ question, answer }))} /></div>
        </div>
      </section>
    </div>
  );
}
