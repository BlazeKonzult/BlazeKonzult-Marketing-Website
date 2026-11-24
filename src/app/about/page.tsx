import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import Image from "next/image";
import Button from "@/components/Button";
import PageHero from "@/components/PageHero";
import SectionIntro from "@/components/SectionIntro";
import CtaBand from "@/components/CtaBand";
import JsonLd from "@/components/JsonLd";
import LinkedinIcon from "@/components/LinkedinIcon";
import RichText from "@/components/RichText";
import { siteUrl } from "@/lib/site";
import { getDoc } from "@/content/server";
import { getCatalog, getUi } from "@/content/catalog";
import type { AboutDoc } from "@/content/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getDoc<AboutDoc>("page:about");
  return { title: c.seo.title, description: c.seo.description, alternates: await alternates("/about") };
}

export default async function AboutPage() {
  const t = await getUi();
  const [c, catalog] = await Promise.all([getDoc<AboutDoc>("page:about"), getCatalog()]);
  const { credentials, methodology, company: companyInfo } = catalog.site;
  const { expertise } = c.founder;
  const statements = c.statements.items;
  const values = c.values.items;
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: companyInfo.founder,
    jobTitle: `Founder, ${companyInfo.name}`,
    image: companyInfo.founderPhoto.startsWith("/") ? `${siteUrl}${companyInfo.founderPhoto}` : companyInfo.founderPhoto,
    sameAs: [companyInfo.linkedin],
    worksFor: { "@type": "Organization", name: "BlazeKonzult" },
    hasCredential: credentials.map((c) => ({ "@type": "EducationalOccupationalCredential", name: `${c.code}: ${c.name}` })),
  };

  return (
    <>
      <JsonLd data={personJsonLd} />

      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.about }]}
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        description={c.hero.description}
      />

      {/* Founder */}
      <section id="founder" className="section bg-paper scroll-mt-20">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start max-w-md w-full mx-auto lg:mx-0">
            <Image
              src={companyInfo.founderPhoto}
              alt={companyInfo.founderPhotoAlt}
              width={473}
              height={591}
              priority
              sizes="(min-width: 1024px) 28rem, 90vw"
              className="w-full h-auto aspect-[4/5] object-cover object-top rounded-[var(--radius-md)]"
            />
            <div className="mt-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-heading">{companyInfo.founder}</p>
                <p className="text-sm text-muted">{companyInfo.founderTitle}</p>
              </div>
              <a href={companyInfo.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${companyInfo.founder} on LinkedIn`} className="grid place-items-center w-10 h-10 rounded-[var(--radius-sm)] border border-line text-heading hover:border-brand hover:text-brand">
                <LinkedinIcon size={17} />
              </a>
            </div>
          </div>

          <div>
            <SectionIntro eyebrow={c.founder.eyebrow} title={c.founder.title} />
            <div className="mt-8 space-y-5 text-body leading-relaxed text-[1.0625rem] max-w-2xl">
              {c.founder.paragraphs.map((p, i) => <RichText key={i} text={p} />)}
            </div>

            <blockquote className="mt-10 border-l-2 border-brand pl-6 font-[family-name:var(--font-display)] text-xl sm:text-2xl font-semibold leading-snug text-heading max-w-2xl">
              &ldquo;{c.founder.quote}&rdquo;
            </blockquote>

            <h2 className="t-eyebrow text-muted mt-14">{c.founder.certificationsLabel}</h2>
            <ul className="mt-4 border-t border-line">
              {credentials.map((c) => (
                <li key={c.code} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-4 border-b border-line">
                  <span className="font-[family-name:var(--font-display)] font-bold text-heading">{c.code}</span>
                  <span className="text-body">{c.name}</span>
                </li>
              ))}
            </ul>

            <h2 className="t-eyebrow text-muted mt-12">{c.founder.expertiseLabel}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {expertise.map((a) => (
                <li key={a} className="text-sm text-heading bg-white border border-line rounded-[var(--radius-xs)] px-3 py-1.5">{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Mission / vision / purpose */}
      <section className="on-dark surface-dark section">
        <div className="container-page">
          <SectionIntro tone="dark" eyebrow={c.statements.eyebrow} title={c.statements.title} />
          <dl className="mt-14 grid gap-10 md:grid-cols-3">
            {statements.map((s) => (
              <div key={s.label} className="border-t border-ink-700 pt-6">
                <dt className="t-eyebrow text-brand-300">{s.label}</dt>
                <dd className="mt-4 text-ink-200 leading-relaxed">{s.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Values + approach */}
      <section className="section bg-white border-b border-line">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionIntro eyebrow={c.values.eyebrow} title={c.values.title} />
            <ul className="mt-10 space-y-8">
              {values.map((v, i) => (
                <li key={v.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)]">
                  <span className="t-mono text-sm text-brand pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="t-h3">{v.title}</h3>
                    <p className="mt-1 text-body">{v.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionIntro eyebrow={c.approach.eyebrow} title={c.approach.title} />
            <ol className="mt-10 border-t border-line">
              {methodology.map((m) => (
                <li key={m.step} className="grid grid-cols-[2.5rem_8rem_minmax(0,1fr)] gap-2 py-4 border-b border-line items-baseline">
                  <span className="t-mono text-xs text-muted">{m.step}</span>
                  <span className="font-semibold text-heading">{m.title}</span>
                  <span className="text-sm text-body">{m.output}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Button href={c.approach.button.href} variant="secondary" arrow>{c.approach.button.label}</Button>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title={c.closing.title} body={c.closing.body} primary={c.closing.primary} secondary={c.closing.secondary} />
    </>
  );
}
