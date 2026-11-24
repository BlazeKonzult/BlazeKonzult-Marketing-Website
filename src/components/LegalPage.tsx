import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import { ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import RichText from "@/components/RichText";
import { getUi } from "@/content/catalog";
import { getDoc } from "@/content/server";
import type { LegalDoc } from "@/content/defaults";

export async function legalMetadata(slug: string): Promise<Metadata> {
  const c = await getDoc<LegalDoc>(`page:${slug}`);
  return { title: c.seo.title, description: c.seo.description, alternates: await alternates(`/${slug}`) };
}

/** Privacy, cookie and disclosure pages: headed sections edited in the admin. */
export default async function LegalPage({ slug }: { slug: string }) {
  const t = await getUi();
  const c = await getDoc<LegalDoc>(`page:${slug}`);
  return (
    <>
      <PageHero breadcrumbs={[{ label: t.home, href: "/" }, { label: t.legal }]} eyebrow={t.legal} title={c.title} description={c.intro} />
      <section className="section bg-paper">
        <div className="container-narrow space-y-8 text-body leading-relaxed">
          {c.notice && (
            <div className="flex items-start gap-3 bg-mist border border-line rounded-[var(--radius-md)] p-5">
              <ShieldCheck size={22} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
              <RichText className="text-sm text-heading" text={c.notice} />
            </div>
          )}
          {c.sections.map((s, i) => (
            <div key={i} id={/assessment/i.test(s.heading) ? "assessment" : undefined} className="scroll-mt-28">
              <h2 className="t-h3 mb-3">{s.heading}</h2>
              <div className="space-y-3">{s.paragraphs.filter(Boolean).map((p, j) => <RichText key={j} text={p} />)}</div>
              {s.bullets.filter(Boolean).length > 0 && (
                <ul className="list-disc pl-5 space-y-2 mt-3">{s.bullets.filter(Boolean).map((b, j) => <RichText as="li" key={j} text={b} />)}</ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
