import type { Metadata } from "next";
import { alternates } from "@/lib/seo";
import Link from "@/components/LocalLink";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import SectionIntro from "@/components/SectionIntro";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import RichText from "@/components/RichText";
import CoverImage from "@/components/CoverImage";
import { siteUrl } from "@/lib/site";
import { getArticle, getArticles, getDoc } from "@/content/server";
import type { ResourcesDoc } from "@/content/defaults";
import { getUi } from "@/content/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.excerpt,
    alternates: await alternates(`/resources/${article.slug}`),
    openGraph: { type: "article", title: article.seo?.title || article.title, description: article.seo?.description || article.excerpt, ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}) },
  };
}

export default async function ArticlePage({ params }: Props) {
  const t = await getUi();
  const { slug } = await params;
  const [article, articles, page] = await Promise.all([getArticle(slug), getArticles(), getDoc<ResourcesDoc>("page:resources")]);
  if (!article) notFound();
  const L = page.article;
  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);
  const formattedDate = new Date(article.date).toLocaleDateString(t.dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "BlazeKonzult" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Resources", item: `${siteUrl}/resources/` },
      { "@type": "ListItem", position: 2, name: article.title, item: `${siteUrl}/resources/${article.slug}/` },
    ],
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero
        breadcrumbs={[{ label: t.home, href: "/" }, { label: t.insights, href: "/resources" }, { label: article.category }]}
        eyebrow={article.category}
        title={article.title}
      >
        <p className="t-mono text-sm text-ink-300">
          {formattedDate} · {article.readTime}{article.author ? ` · ${t.artBy} ${article.author}` : ""}
        </p>
      </PageHero>

      <article className="section bg-paper">
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
          <div className="prose-bk max-w-[44rem] text-body text-[1.0625rem] leading-[1.75]">
            {article.coverImage && <CoverImage article={article} className="aspect-[16/9] rounded-[var(--radius-md)] !mt-0 mb-8" />}
            {!article.translated && t.artEnglishOnly && <p lang="nl" className="!mt-0 mb-6 rounded-[var(--radius-sm)] border border-line bg-white px-4 py-3 text-sm text-muted">{t.artEnglishOnly}</p>}
            <p lang={article.translated ? undefined : "en"} className="t-lead text-heading !mt-0">{article.excerpt}</p>
            {article.body.map((block, i) => {
              if ("h" in block) return <h2 key={i}>{block.h}</h2>;
              if ("ul" in block)
                return (
                  <ul key={i}>
                    {block.ul.map((item, j) => (
                      <RichText as="li" key={j} text={item} />
                    ))}
                  </ul>
                );
              return <RichText key={i} text={block.p} />;
            })}
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start space-y-6">
            <div className="on-dark surface-dark rounded-[var(--radius-md)] p-6">
              <p className="t-eyebrow text-brand-300">{L.nextStepLabel}</p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold text-white leading-snug">{L.nextStepTitle}</p>
              <p className="mt-2 text-sm text-ink-300">{L.nextStepText}</p>
              <Link href={L.nextStepLink.href} className="arrow-link mt-5 text-sm text-white">
                {L.nextStepLink.label} <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <Link href="/resources" className="arrow-link text-sm text-cobalt hover:text-brand">
              <ArrowLeft size={15} aria-hidden="true" /> {L.backLabel}
            </Link>
          </aside>
        </div>
      </article>

      <section className="section bg-white border-t border-line">
        <div className="container-page">
          <SectionIntro eyebrow={L.relatedEyebrow} title={L.relatedTitle} />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={L.closing.title} body={L.closing.body} primary={L.closing.primary} secondary={L.closing.secondary} />
    </>
  );
}
