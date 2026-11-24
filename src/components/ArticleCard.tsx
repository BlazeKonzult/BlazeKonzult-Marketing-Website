"use client";

import Link from "@/components/LocalLink";
import { useT } from "@/components/SiteData";
import type { Article } from "@/lib/data";
import CoverImage from "@/components/CoverImage";

export default function ArticleCard({ article }: { article: Article & { coverImage?: string; coverAlt?: string } }) {
  const { t } = useT();
  const formattedDate = new Date(article.date).toLocaleDateString(t.dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <article className="group relative flex flex-col">
      <CoverImage article={article} className="aspect-[16/10] rounded-[var(--radius-md)] transition-transform duration-500 group-hover:scale-[1.01]" />
      <p className="mt-5 t-mono text-xs text-muted">
        {formattedDate} · {article.readTime}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug text-heading">
        <Link href={`/resources/${article.slug}`} className="after:absolute after:inset-0 group-hover:text-brand transition-colors">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 text-[0.9375rem] text-body leading-relaxed">{article.excerpt}</p>
    </article>
  );
}
