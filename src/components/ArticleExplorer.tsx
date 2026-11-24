"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { useT } from "@/components/SiteData";
import type { Article } from "@/lib/data";

/** Searchable, category-filterable article grid for the Resources page. */
export default function ArticleExplorer({ articles, searchText }: { articles: (Article & { coverImage?: string; coverAlt?: string })[]; searchText: Record<string, string> }) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(articles.map((a) => a.category))), [articles]);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return articles.filter((a) => {
      if (category && a.category !== category) return false;
      if (terms.length === 0) return true;
      const haystack = `${a.title} ${a.excerpt} ${a.category} ${searchText[a.slug] ?? ""}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [articles, searchText, query, category]);

  const chip = (active: boolean) =>
    `inline-flex items-center h-9 px-3.5 rounded-[var(--radius-sm)] text-sm font-medium border transition-colors ${
      active ? "bg-ink-950 border-ink-950 text-white" : "bg-white border-line text-body hover:border-heading/30"
    }`;

  return (
    <>
      <div role="search" className="max-w-md mb-8">
        <label htmlFor="resource-search" className="sr-only">{t.artSearch}</label>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.artSearchPh}
            className="field pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-12" role="group" aria-label={t.artFilter}>
        <button type="button" className={chip(category === null)} aria-pressed={category === null} onClick={() => setCategory(null)}>
          {t.artAll}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={chip(category === c)}
            aria-pressed={category === c}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {t.artFound(results.length)}
      </p>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {results.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-body">{t.artNone}</p>
      )}
    </>
  );
}
