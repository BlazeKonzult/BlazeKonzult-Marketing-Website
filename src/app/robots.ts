import type { MetadataRoute } from "next";

// Production domain is set in src/lib/site.ts
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

const baseUrl = siteUrl;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/cybersecurity-assessment/results/", "/nl/cybersecurity-assessment/results/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
