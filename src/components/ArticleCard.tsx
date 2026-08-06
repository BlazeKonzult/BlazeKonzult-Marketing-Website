import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { Article } from "@/lib/data";

export default function ArticleCard({ article }: { article: Article }) {
  const formattedDate = new Date(article.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-light-lavender overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {/* PLACEHOLDER: replace with real article cover image */}
      <div className="h-40 gradient-purple-soft flex items-center justify-center border-b border-light-lavender">
        <span className="text-xs font-semibold text-primary-purple uppercase tracking-wide">
          {article.category}
        </span>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} aria-hidden="true" /> {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" /> {article.readTime}
          </span>
        </div>
        <h3 className="text-lg font-bold text-deep-purple mb-2 leading-snug">
          <Link href={`/resources/${article.slug}`} className="hover:text-primary-purple">
            {article.title}
          </Link>
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed flex-1">{article.excerpt}</p>
        <Link
          href={`/resources/${article.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-purple hover:text-deep-purple"
        >
          Read article
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
