import type { Metadata } from "next";
import Landing from "@/components/assessment/Landing";
import { bySlug, catalog } from "@/lib/assessment/catalog";
import { paths, pick } from "@/lib/assessment/i18n";

export function generateStaticParams() { return catalog.map((t) => ({ slug: t.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const x = bySlug(slug)!;
  return {
    title: pick(x.seo.title, "en"), description: pick(x.seo.description, "en"),
    alternates: { canonical: paths.landing("en", slug), languages: { en: paths.landing("en", slug), nl: paths.landing("nl", slug), "x-default": paths.landing("en", slug) } },
    openGraph: { title: pick(x.seo.title, "en"), description: pick(x.seo.description, "en") },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Landing locale="en" slug={slug} />;
}
