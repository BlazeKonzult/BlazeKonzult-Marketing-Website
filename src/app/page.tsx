import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import Image from "next/image";
import Link from "@/components/LocalLink";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import Button from "@/components/Button";
import SectionIntro from "@/components/SectionIntro";
import IconRenderer from "@/components/IconRenderer";
import FAQAccordion from "@/components/FAQAccordion";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import IndustryExplorer from "@/components/IndustryExplorer";
import HeroVisual from "@/components/visuals/HeroVisual";
import AssessmentPreview from "@/components/visuals/AssessmentPreview";
import RichText from "@/components/RichText";
import CoverImage from "@/components/CoverImage";
import { getDoc, getArticles } from "@/content/server";
import { getCatalog, serviceLookup, getUi } from "@/content/catalog";
import type { HomeDoc } from "@/content/defaults";
import type { Service } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getDoc<HomeDoc>("page:home");
  return { title: { absolute: c.seo.title }, description: c.seo.description, alternates: await alternates("/") };
}

const fmtDate = (d: string, loc = "en-GB") =>
  new Date(d).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function HomePage() {
  const t = await getUi();
  const [c, catalog, articles] = await Promise.all([getDoc<HomeDoc>("page:home"), getCatalog(), getArticles()]);
  const { credentials, frameworks, methodology, company: companyInfo } = catalog.site;
  const find = serviceLookup(catalog.services);
  const serviceBySlug = (slug: string) => find(slug)!;
  const challenges = c.challenges.items;
  const differentiators = c.why.items;
  const homeFaqs = c.faq.items;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  const healthCheck = serviceBySlug("cybersecurity-health-check");
  const nis2 = serviceBySlug("nis2-readiness");
  const rowServices = ["virtual-ciso", "managed-security", "security-awareness-training", "incident-response-readiness", "supplier-security-assurance"].map(find).filter(Boolean) as Service[];
  const featured = articles.find((a) => a.category === "NIS2 & Regulation") ?? articles[0];
  const latest = featured ? articles.filter((a) => a.slug !== featured.slug).slice(0, 3) : [];

  return (
    <>
      <JsonLd data={faqJsonLd} />

      {/* ============ 2. HERO ============ */}
      <section className="on-dark surface-dark relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_80%_70%_at_70%_40%,black,transparent)]" />
        <div className="container-page relative grid grid-cols-1 items-center gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+4.5rem)] pb-14 sm:pb-20 lg:pb-24">
          <div>
            <p className="t-eyebrow text-brand-300 hero-enter flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-6 bg-brand-300/60" />
              {c.hero.eyebrow}
            </p>
            <h1 className="t-display mt-6 hero-enter-2">
              {c.hero.titleLine1}
              <br />
              <span className="text-brand-300">{c.hero.titleLine2}</span>
            </h1>
            <p className="t-lead mt-6 max-w-xl text-ink-300 hero-enter-3">
              {c.hero.lead}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 hero-enter-3">
              <Button href={c.hero.primary.href} size="lg" arrow>{c.hero.primary.label}</Button>
              <Button href={c.hero.secondary.href} size="lg" variant="inverse">{c.hero.secondary.label}</Button>
            </div>
          </div>
          <div className="relative hero-enter-3 -mx-4 sm:mx-0">
            <HeroVisual locale={catalog.locale} className="w-full max-w-[38rem] mx-auto h-auto" />
          </div>
        </div>

        {/* ============ 3. TRUST ============ */}
        <div className="relative border-t border-ink-700 bg-ink-900/60">
          <div className="container-page py-7 grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-center lg:gap-10">
            <p className="t-eyebrow text-ink-300 leading-relaxed">{c.hero.credentialsLabel}</p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
              {credentials.map((c) => (
                <li key={c.code} className="lg:border-l lg:border-ink-700 lg:pl-5">
                  <span className="block font-[family-name:var(--font-display)] text-lg font-bold text-white tracking-tight">{c.code}</span>
                  <span className="block text-xs text-ink-300 leading-snug mt-0.5">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="container-page pb-7 grid gap-3 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-center lg:gap-10">
            <span className="t-eyebrow text-ink-300">{c.hero.frameworksLabel}</span>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:pl-5">
              {frameworks.map((f) => (
                <li key={f} className="t-mono text-xs text-ink-200">{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ 4. CHALLENGES ============ */}
      <section className="section bg-paper">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionIntro eyebrow={c.challenges.eyebrow} title={c.challenges.title} lead={c.challenges.lead} />
            <Link href={c.challenges.link.href} className="arrow-link mt-8 text-cobalt hover:text-brand">
              {c.challenges.link.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <ol className="grid sm:grid-cols-2 gap-x-10 border-t border-line">
            {challenges.map((c, i) => (
              <li key={c.title} className="reveal border-b border-line py-8">
                <div className="flex items-center gap-4">
                  <span className="t-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <IconRenderer name={c.icon} size={20} className="text-brand" />
                </div>
                <h3 className="t-h3 mt-4">{c.title}</h3>
                <p className="mt-2 text-body leading-relaxed">{c.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ 5. SERVICES ============ */}
      <section className="section bg-white border-y border-line">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionIntro eyebrow={c.services.eyebrow} title={c.services.title} lead={c.services.lead} />
            <Link href={c.services.link.href} className="arrow-link shrink-0 text-cobalt hover:text-brand">
              {c.services.link.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-12">
            {/* Featured: Health Check */}
            <Link href={healthCheck.href} className="reveal group lg:col-span-7 relative overflow-hidden rounded-[var(--radius-md)] bg-mist border border-line p-7 sm:p-10 flex flex-col min-h-[22rem]">
              <span className="t-eyebrow text-brand">{c.services.featuredLabel}</span>
              <h3 className="t-h2 mt-4 max-w-md">{healthCheck.name}</h3>
              <p className="mt-4 text-body max-w-md leading-relaxed">{healthCheck.shortDescription}</p>
              <ul className="mt-6 grid grid-cols-1 xs:grid-cols-2 gap-x-6 gap-y-2 max-w-md">
                {healthCheck.deliverables.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-heading">
                    <Check size={15} className="text-ok shrink-0" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
              <span className="arrow-link mt-auto pt-8 text-heading group-hover:text-brand">
                {c.services.featuredLinkLabel} <ArrowRight size={16} aria-hidden="true" />
              </span>
              <svg aria-hidden="true" viewBox="0 0 200 200" className="hidden md:block absolute -right-6 -bottom-6 w-56 opacity-90">
                {[0.9, 0.62, 0.78, 0.4, 0.7, 0.3, 0.66].map((v, i) => (
                  <rect key={i} x={20 + i * 24} y={180 - v * 150} width="14" height={v * 150} rx="2" fill={i === 3 || i === 5 ? "var(--color-brand)" : "var(--color-line)"} />
                ))}
              </svg>
            </Link>

            {/* Featured: NIS2 */}
            <Link href={nis2.href} className="reveal group lg:col-span-5 on-dark surface-dark relative overflow-hidden rounded-[var(--radius-md)] p-7 sm:p-10 flex flex-col min-h-[22rem]">
              <div aria-hidden="true" className="absolute inset-0 bg-grid-dark opacity-70" />
              <span className="relative t-eyebrow text-brand-300">{c.services.regulationLabel}</span>
              <h3 className="relative t-h2 mt-4">{nis2.name}</h3>
              <p className="relative mt-4 text-ink-300 leading-relaxed">{nis2.shortDescription}</p>
              <div className="relative mt-6 flex items-baseline gap-3 border-t border-ink-700 pt-5">
                <span className="t-mono text-2xl text-white">{c.services.regulationDate}</span>
                <span className="text-sm text-ink-300">{c.services.regulationDateLabel}</span>
              </div>
              <span className="relative arrow-link mt-auto pt-8 text-white">
                {c.services.regulationLinkLabel} <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          </div>

          {/* Editorial rows */}
          <ul className="mt-5 border-t border-line">
            {rowServices.map((s) => (
              <li key={s.slug} className="reveal border-b border-line">
                <Link href={s.href} className="group grid gap-3 py-7 md:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1.4fr)_auto] md:items-center md:gap-8">
                  <IconRenderer name={s.icon} size={24} className="text-brand" />
                  <div>
                    <p className="t-eyebrow text-muted">{t.categories[s.category] ?? s.category}</p>
                    <h3 className="t-h3 mt-1 group-hover:text-brand transition-colors">{s.name}</h3>
                  </div>
                  <p className="text-body leading-relaxed">{s.shortDescription}</p>
                  <span className="hidden md:grid place-items-center w-11 h-11 rounded-full border border-line text-heading transition-colors group-hover:bg-brand group-hover:border-brand group-hover:text-white">
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ 6. ASSESSMENT ============ */}
      <section className="on-dark surface-dark section relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2 bg-grid-dark [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div className="container-page relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
          <div>
            <SectionIntro tone="dark" eyebrow={c.assessment.eyebrow} title={c.assessment.title} lead={c.assessment.lead} />
            <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md border-t border-ink-700 pt-6">
              {c.assessment.stats.map(({ value: n, label: l }) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd>
                    <span className="block font-[family-name:var(--font-display)] text-3xl font-bold text-white">{n}</span>
                    <span className="text-sm text-ink-300">{l}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-9">
              <Button href={c.assessment.button.href} size="lg" arrow>{c.assessment.button.label}</Button>
            </div>
            <p className="mt-4 text-sm text-ink-300">{c.assessment.note}</p>
          </div>
          <div className="reveal">
            <AssessmentPreview />
          </div>
        </div>
      </section>

      {/* ============ 7. WHY BLAZEKONZULT ============ */}
      <section className="section bg-paper">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="on-dark surface-dark relative overflow-hidden rounded-[var(--radius-md)] min-h-[20rem] p-8 sm:p-10 flex flex-col justify-end">
            <svg aria-hidden="true" viewBox="0 0 320 320" className="absolute inset-x-0 top-0 w-full opacity-90">
              {/* Layered planes: assessment, controls, governance */}
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={`translate(0 ${i * 42})`}>
                  <polygon points="160,40 290,105 160,170 30,105" fill={i === 1 ? "rgb(109 59 234 / 0.35)" : "rgb(19 37 56 / 0.6)"} stroke={i === 1 ? "#B39DFA" : "#2B4562"} />
                </g>
              ))}
              <line x1="160" y1="40" x2="160" y2="296" stroke="#00B8D9" strokeDasharray="2 6" />
            </svg>
            <p className="relative font-[family-name:var(--font-display)] text-2xl sm:text-[1.75rem] font-semibold leading-snug text-white">
              {c.why.promise}
            </p>
            <p className="relative mt-3 text-sm text-ink-300">{c.why.promiseLabel}</p>
          </div>
          <div>
            <SectionIntro eyebrow={c.why.eyebrow} title={c.why.title} />
            <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {differentiators.map((d) => (
                <li key={d.title} className="reveal">
                  <h3 className="flex items-start gap-3 font-[family-name:var(--font-display)] text-[1.0625rem] font-semibold text-heading tracking-tight">
                    <span aria-hidden="true" className="mt-1 grid place-items-center w-5 h-5 shrink-0 rounded-full bg-brand-50 text-brand">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {d.title}
                  </h3>
                  <p className="mt-2 pl-8 text-body leading-relaxed">{d.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ 8. METHODOLOGY ============ */}
      <section className="section bg-white border-y border-line">
        <div className="container-page">
          <SectionIntro eyebrow={c.method.eyebrow} title={c.method.title} lead={c.method.lead} />
          <ol className="relative mt-16 grid gap-0 lg:grid-cols-5 lg:gap-6">
            <span aria-hidden="true" className="hidden lg:block absolute left-0 right-0 top-[1.375rem] h-px bg-line" />
            <span aria-hidden="true" className="hidden lg:block absolute left-0 right-0 top-[1.375rem] h-px bg-brand origin-left reveal-line" />
            {methodology.map((m, i) => (
              <li key={m.step} className="reveal relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-5 pb-10 lg:block lg:pb-0">
                {i < methodology.length - 1 && <span aria-hidden="true" className="lg:hidden absolute left-[1.375rem] top-11 bottom-0 w-px bg-line" />}
                <span className="relative z-10 grid place-items-center w-11 h-11 rounded-full bg-ink-950 text-white t-mono text-sm ring-8 ring-white">
                  {m.step}
                </span>
                <div className="lg:mt-6">
                  <h3 className="t-h3">{m.title}</h3>
                  <p className="mt-2 text-body leading-relaxed">{m.description}</p>
                  <p className="mt-4 inline-flex items-center gap-2 t-mono text-xs text-muted">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
                    {m.output}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ 9. INDUSTRIES ============ */}
      <section className="section bg-paper">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionIntro eyebrow={c.industries.eyebrow} title={c.industries.title} lead={c.industries.lead} />
            <Link href={c.industries.link.href} className="arrow-link shrink-0 text-cobalt hover:text-brand">
              {c.industries.link.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-12">
            <IndustryExplorer />
          </div>
        </div>
      </section>

      {/* ============ 10. LEADERSHIP ============ */}
      <section className="section bg-white border-y border-line">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-20">
          <div className="relative max-w-md mx-auto lg:mx-0 w-full pr-5 pb-5">
            <div aria-hidden="true" className="absolute left-5 top-5 right-0 bottom-0 rounded-[var(--radius-md)] bg-grid-light border border-line" />
            <Image
              src={companyInfo.founderPhoto}
              alt={companyInfo.founderPhotoAlt}
              width={473}
              height={591}
              sizes="(min-width: 1024px) 28rem, 90vw"
              className="relative w-full h-auto aspect-[4/5] object-cover object-top rounded-[var(--radius-md)]"
            />
          </div>
          <div>
            <SectionIntro eyebrow={c.leadership.eyebrow} title={c.leadership.title} lead={c.leadership.lead} />
            <div className="mt-6 space-y-4 text-body leading-relaxed max-w-2xl">
              {c.leadership.paragraphs.map((p, i) => <RichText key={i} text={p} />)}
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {credentials.map((c) => (
                <li key={c.code} title={c.name} className="t-mono text-xs font-medium text-heading border border-line rounded-[var(--radius-xs)] px-2.5 py-1.5">
                  {c.code}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Button href={c.leadership.primary.href} variant="secondary" arrow>{c.leadership.primary.label}</Button>
              <Button href={companyInfo.linkedin} variant="secondary">{c.leadership.linkedinLabel}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 11. INSIGHTS ============ */}
      <section className="section bg-paper">
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionIntro eyebrow={c.insights.eyebrow} title={c.insights.title} />
            <Link href={c.insights.link.href} className="arrow-link shrink-0 text-cobalt hover:text-brand">
              {c.insights.link.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {featured && <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
            <Link href={`/resources/${featured.slug}`} className="group block">
              <CoverImage article={featured} size="lg" className="aspect-[16/9] rounded-[var(--radius-md)]" />
              <p className="mt-6 t-mono text-xs text-muted">
                {c.insights.featuredLabel} · {fmtDate(featured.date, t.dateLocale)} · {featured.readTime}
              </p>
              <h3 className="t-h2 mt-3 text-[clamp(1.5rem,1.2rem+1.2vw,2.125rem)] group-hover:text-brand transition-colors">{featured.title}</h3>
              <p className="mt-3 text-body leading-relaxed max-w-xl">{featured.excerpt}</p>
            </Link>
            <ul className="border-t border-line">
              {latest.map((a) => (
                <li key={a.slug} className="border-b border-line">
                  <Link href={`/resources/${a.slug}`} className="group grid grid-cols-[minmax(0,1fr)_6.5rem] gap-5 py-6 items-start">
                    <div>
                      <p className="t-eyebrow text-brand">{a.category}</p>
                      <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug text-heading group-hover:text-brand transition-colors">{a.title}</h3>
                      <p className="mt-2 t-mono text-xs text-muted">{fmtDate(a.date, t.dateLocale)} · {a.readTime}</p>
                    </div>
                    <CoverImage article={a} className="aspect-square rounded-[var(--radius-sm)] [&_span]:hidden" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>}
        </div>
      </section>

      {/* ============ 12. FAQ ============ */}
      <section className="section bg-white border-t border-line">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-20">
          <div>
            <SectionIntro eyebrow={c.faq.eyebrow} title={c.faq.title} />
            <RichText className="mt-6 text-body" text={c.faq.note} />
          </div>
          <FAQAccordion items={homeFaqs} />
        </div>
      </section>

      {/* ============ 13. FINAL CTA ============ */}
      <CtaBand title={c.closing.title} body={c.closing.body} primary={c.closing.primary} secondary={c.closing.secondary} />
    </>
  );
}
