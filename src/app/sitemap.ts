import type { MetadataRoute } from "next";
import { articles } from "@/lib/data";

// PLACEHOLDER: update baseUrl to the production domain before launch.
const baseUrl = "https://www.blazekonzult.example";

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
  "/contact",
  "/privacy-policy",
  "/cookie-policy",
  "/responsible-disclosure",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${baseUrl}/resources/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticEntries, ...articleEntries];
}
