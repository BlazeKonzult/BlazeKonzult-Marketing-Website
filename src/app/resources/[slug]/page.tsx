import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import { articles } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/resources/${article.slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 3);
  const formattedDate = new Date(article.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    author: { "@type": "Person", name: "Adeiza Johnson Yisa" },
    publisher: { "@type": "Organization", name: "BlazeKonzult" },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Resources", item: "/resources" },
      { "@type": "ListItem", position: 2, name: article.title, item: `/resources/${article.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <section className="gradient-purple-soft border-b border-light-lavender">
        <div className="container-page py-16 sm:py-20 max-w-3xl">
          <Link href="/resources" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-purple hover:text-deep-purple mb-6">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Resources
          </Link>
          <p className="text-sm font-semibold text-primary-purple uppercase tracking-wide mb-3">{article.category}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-deep-purple leading-tight">{article.title}</h1>
          <div className="flex items-center gap-5 mt-5 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5"><Calendar size={14} aria-hidden="true" /> {formattedDate}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} aria-hidden="true" /> {article.readTime}</span>
          </div>
        </div>
      </section>

      <article className="py-16 sm:py-20">
        <div className="container-page max-w-3xl prose-content">
          {/* PLACEHOLDER: replace with the full article body content */}
          <p className="text-lg text-text-secondary leading-relaxed">{article.excerpt}</p>
          <p className="mt-6 text-text-secondary leading-relaxed">
            This is placeholder article content. The full, published version of this article will
            replace this text — covering practical, non-technical guidance in line with
            BlazeKonzult&apos;s calm, business-focused approach to cybersecurity.
          </p>
          <div className="mt-10 bg-light-lavender rounded-2xl p-6">
            <p className="font-semibold text-deep-purple mb-2">Want tailored guidance for your organisation?</p>
            <p className="text-sm text-text-secondary mb-4">
              A Cybersecurity Health Check gives you a clear view of your priority risks and a practical plan.
            </p>
            <Button href="/contact" size="md">Book a Free Discovery Call</Button>
          </div>
        </div>
      </article>

      <section className="py-16 sm:py-20 bg-white border-t border-light-lavender">
        <div className="container-page">
          <SectionHeading eyebrow="Continue reading" title="Related articles" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
