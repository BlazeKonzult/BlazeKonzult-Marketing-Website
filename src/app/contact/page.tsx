import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import Link from "@/components/LocalLink";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import LinkedinIcon from "@/components/LinkedinIcon";
import RichText from "@/components/RichText";
import { getDoc } from "@/content/server";
import { getCatalog, getUi } from "@/content/catalog";
import type { ContactDoc } from "@/content/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getDoc<ContactDoc>("page:contact");
  return { title: c.seo.title, description: c.seo.description, alternates: await alternates("/contact") };
}

export default async function ContactPage() {
  const t = await getUi();
  const [c, catalog] = await Promise.all([getDoc<ContactDoc>("page:contact"), getCatalog()]);
  const companyInfo = catalog.site.company;
  const expectations = c.next.items;
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.contact }]}
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        description={c.hero.description}
      />

      <section id="enquiry" className="section bg-paper scroll-mt-20">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div className="bg-white rounded-[var(--radius-md)] border border-line shadow-[var(--shadow-raised)] p-6 sm:p-10">
            <h2 className="t-h3 text-[1.5rem]">{c.form.title}</h2>
            <p className="mt-1 mb-8 text-sm text-muted">{c.form.note}</p>
            <ContactForm />
          </div>

          <aside className="space-y-10">
            <div>
              <h2 className="t-eyebrow text-muted">{c.next.title}</h2>
              <ol className="mt-5 space-y-6">
                {expectations.map((e, i) => (
                  <li key={e.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)]">
                    <span className="grid place-items-center w-7 h-7 rounded-full bg-ink-950 text-white t-mono text-xs">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-heading">{e.title}</p>
                      <p className="mt-1 text-sm text-body">{e.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-line pt-8 space-y-4 text-[0.9375rem]">
              <p className="flex gap-3 text-body"><MapPin size={18} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />{companyInfo.serviceArea}</p>
              <a href={companyInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex gap-3 text-cobalt hover:text-brand">
                <LinkedinIcon size={18} className="shrink-0 mt-0.5" />{c.linkedinLabel}
              </a>
            </div>

            <div className="on-dark surface-dark rounded-[var(--radius-md)] p-6">
              <p className="t-eyebrow text-brand-300">{c.assessmentBox.eyebrow}</p>
              <p className="mt-3 text-ink-200">{c.assessmentBox.text}</p>
              <Link href={c.assessmentBox.link.href} className="arrow-link mt-4 text-sm text-white">
                {c.assessmentBox.link.label} <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <p className="flex gap-3 text-sm text-muted leading-relaxed">
              <ShieldCheck size={18} className="text-ok shrink-0 mt-0.5" aria-hidden="true" />
              <RichText as="span" text={c.privacyNote} />
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
