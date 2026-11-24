import type { MetadataRoute } from "next";
import { getArticles } from "@/content/server";
import { catalog } from "@/lib/assessment/catalog";

// Production domain is set in src/lib/site.ts
import { siteUrl } from "@/lib/site";


const baseUrl = siteUrl;

const staticRoutes = [
  "",
  "/services",
  "/cybersecurity-health-check",
  "/nis2-readiness",
  "/virtual-ciso",
  "/managed-security",
  "/security-awareness-training",
  "/incident-response-readiness",
  "/supplier-security-assurance",
  "/about",
  "/resources",
  "/industries",
  "/cybersecurity-assessment",
  "/contact",
  "/privacy-policy",
  "/cookie-policy",
  "/responsible-disclosure",
];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles();
  const both = (route: string) => ({ languages: { en: `${baseUrl}${route}/`, nl: `${baseUrl}/nl${route}/` } });
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap((route) => ["", "/nl"].map((pre) => ({
    url: `${baseUrl}${pre}${route}/`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "" ? 1 : 0.7,
    alternates: both(route),
  })));

  const articleEntries: MetadataRoute.Sitemap = articles.flatMap((a) => ["", "/nl"].map((pre) => ({
    url: `${baseUrl}${pre}/resources/${a.slug}/`,
    lastModified: new Date(a.date),
    changeFrequency: "yearly" as const,
    priority: 0.5,
    alternates: both(`/resources/${a.slug}`),
  })));

  const assessmentEntries: MetadataRoute.Sitemap = catalog.flatMap((t) => ["", "/nl"].map((pre) => ({
    url: `${baseUrl}${pre}/cybersecurity-assessment/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
    alternates: { languages: { en: `${baseUrl}/cybersecurity-assessment/${t.slug}/`, nl: `${baseUrl}/nl/cybersecurity-assessment/${t.slug}/` } },
  })));

  return [...staticEntries, ...assessmentEntries, ...articleEntries];
}
