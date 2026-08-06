import type { Metadata } from "next";
import { Search, Send } from "lucide-react";
import PageHero from "@/components/PageHero";
import SectionHeading from "@/components/SectionHeading";
import ArticleCard from "@/components/ArticleCard";
import LeadMagnetForm from "@/components/LeadMagnetForm";
import { articles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Resources and Insights",
  description:
    "Practical cybersecurity guidance for Dutch SMEs — articles on NIS2 readiness, phishing awareness, Microsoft 365 security, incident readiness and more.",
  alternates: { canonical: "/resources" },
};

const categories = Array.from(new Set(articles.map((a) => a.category)));

export default function ResourcesPage() {
  const [featured, ...rest] = articles;

  return (
    <>
      <PageHero
        eyebrow="Resources and Insights"
        title="Practical cybersecurity guidance for Dutch businesses"
        description="Clear, jargon-free articles to help you understand cyber risk and take confident action."
      >
        {/* Search field — client-side filtering can be wired up later; kept simple and accessible for now */}
        <form role="search" className="mt-8 max-w-md" action="/resources">
          <label htmlFor="resource-search" className="sr-only">Search resources</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              id="resource-search"
              name="q"
              type="search"
              placeholder="Search articles…"
              className="w-full rounded-full border border-light-lavender bg-white pl-11 pr-4 py-3 text-sm min-h-12 focus:border-primary-purple outline-none"
            />
          </div>
        </form>
      </PageHero>

      {/* Featured article */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <p className="text-sm font-semibold text-primary-purple uppercase tracking-wide mb-6">Featured article</p>
          <div className="grid lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-light-lavender shadow-sm overflow-hidden">
            <div className="h-56 lg:h-full gradient-purple-soft flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-purple">{featured.category}</span>
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-deep-purple mb-3">{featured.title}</h2>
              <p className="text-text-secondary leading-relaxed mb-5">{featured.excerpt}</p>
              <a href={`/resources/${featured.slug}`} className="inline-flex text-sm font-semibold text-primary-purple hover:text-deep-purple">
                Read article →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories + article grid */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <div className="flex flex-wrap gap-2 mb-12" aria-label="Article categories">
            {categories.map((c) => (
              <span key={c} className="text-xs font-semibold uppercase tracking-wide text-primary-purple bg-light-lavender rounded-full px-4 py-2">
                {c}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Downloadable resources */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Downloadable resources" title="Free checklists and guides" />
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-light-lavender rounded-2xl p-8">
              <h3 className="text-lg font-bold text-deep-purple mb-2">Cyber Resilience Checklist for Dutch SMEs</h3>
              <p className="text-sm text-text-secondary mb-6">
                Review the essential cybersecurity controls every growing business should consider.
              </p>
              <LeadMagnetForm resourceName="Cyber Resilience Checklist" compact />
            </div>
            <div className="bg-light-lavender rounded-2xl p-8">
              <h3 className="text-lg font-bold text-deep-purple mb-2">NIS2 Supplier Readiness Checklist</h3>
              <p className="text-sm text-text-secondary mb-6">
                A practical checklist to help suppliers prepare for evolving customer cybersecurity expectations.
              </p>
              <LeadMagnetForm resourceName="NIS2 Supplier Readiness Checklist" buttonLabel="Download the Supplier Checklist" compact />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 sm:py-20 bg-white border-t border-light-lavender">
        <div className="container-page max-w-xl text-center">
          <SectionHeading eyebrow="Stay informed" title="Get practical cybersecurity guidance in your inbox" />
          {/* PLACEHOLDER: connect to real newsletter provider (e.g. Mailchimp/Brevo) via secure server-side endpoint */}
          <form className="mt-8 flex flex-col sm:flex-row gap-3" aria-label="Newsletter signup">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@company.nl"
              className="flex-1 rounded-full border border-light-lavender px-5 py-3 text-sm min-h-12 focus:border-primary-purple outline-none"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-purple text-white font-semibold px-6 py-3 min-h-12 hover:bg-deep-purple transition-colors">
              <Send size={16} aria-hidden="true" />
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
