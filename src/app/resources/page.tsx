import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import SectionIntro from "@/components/SectionIntro";
import Link from "@/components/LocalLink";
import ArticleExplorer from "@/components/ArticleExplorer";
import LeadMagnetForm from "@/components/LeadMagnetForm";
import NewsletterForm from "@/components/NewsletterForm";
import CoverImage from "@/components/CoverImage";
import { getUi } from "@/content/catalog";
import { getDoc, getArticles } from "@/content/server";
import type { ResourcesDoc } from "@/content/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getDoc<ResourcesDoc>("page:resources");
  return { title: c.seo.title, description: c.seo.description, alternates: await alternates("/resources") };
}

export default async function ResourcesPage() {
  const t = await getUi();
  const [c, all] = await Promise.all([getDoc<ResourcesDoc>("page:resources"), getArticles()]);
  // Plain-text article bodies so the search box can match article content.
  const searchText = Object.fromEntries(all.map((a) => [a.slug, a.body.map((b) => ("h" in b ? b.h : "p" in b ? b.p : b.ul.join(" "))).join(" ")]));
  const articles = all.map(({ body: _b, seo: _s, ...a }) => a);
  const featured = articles.find((a) => a.slug === c.featuredSlug) ?? articles.find((a) => a.category === "NIS2 & Regulation") ?? articles[0];
  const date = !featured ? "" : new Date(featured.date).toLocaleDateString(t.dateLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.insights }]}
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        description={c.hero.description}
      />

      {/* Featured */}
      {featured && <section className="section-tight bg-paper pt-[var(--space-section)]">
        <div className="container-page">
          <Link href={`/resources/${featured.slug}`} className="group grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
            <CoverImage article={featured} size="lg" className="aspect-[16/9] rounded-[var(--radius-md)]" />
            <div>
              <p className="t-eyebrow text-brand">{c.featuredLabel}</p>
              <h2 className="t-h2 mt-4 group-hover:text-brand transition-colors">{featured.title}</h2>
              <p className="t-lead mt-4 text-body">{featured.excerpt}</p>
              <p className="mt-6 t-mono text-xs text-muted">{date} · {featured.readTime}</p>
            </div>
          </Link>
        </div>
      </section>}

      {/* All articles */}
      <section className="section bg-paper">
        <div className="container-page">
          <h2 className="sr-only">All articles</h2>
          <ArticleExplorer articles={articles} searchText={searchText} />
        </div>
      </section>

      {/* Checklists */}
      <section id="checklists" className="section bg-white border-y border-line scroll-mt-20">
        <div className="container-page">
          <SectionIntro eyebrow={c.checklists.eyebrow} title={c.checklists.title} lead={c.checklists.lead} />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {c.checklists.items.map((x) => (
              <div key={x.name} className="rounded-[var(--radius-md)] bg-mist border border-line p-6 sm:p-8">
                <h3 className="t-h3">{x.title}</h3>
                <p className="mt-2 mb-6 text-body">{x.text}</p>
                <LeadMagnetForm resourceName={x.name} buttonLabel={x.buttonLabel} compact />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="on-dark surface-dark section-tight">
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <h2 className="t-h3 text-[1.5rem]">{c.newsletter.title}</h2>
            <p className="mt-2 text-ink-300">{c.newsletter.text}</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
