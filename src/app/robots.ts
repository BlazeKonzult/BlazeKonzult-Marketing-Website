import type { MetadataRoute } from "next";

// PLACEHOLDER: update to the production domain before launch.
const baseUrl = "https://www.blazekonzult.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
