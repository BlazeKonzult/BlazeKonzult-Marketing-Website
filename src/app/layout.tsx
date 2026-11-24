import type { Metadata } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import JsonLd from "@/components/JsonLd";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

import { siteUrl } from "@/lib/site";
import { getCatalog } from "@/content/catalog";
import { SiteDataProvider } from "@/components/SiteData";
import { getBasePath } from "@/lib/locale-server";
import { localizeHref } from "@/lib/locale";

// Content is edited in the admin and read from the database on each request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site, locale } = await getCatalog();
  const seo = site.seo;
  const path = await getBasePath();
  return {
    alternates: { canonical: localizeHref(path, locale), languages: { en: path, nl: localizeHref(path, "nl"), "x-default": path } },
    metadataBase: new URL(siteUrl),
    title: { default: seo.defaultTitle, template: `%s | ${seo.titleSuffix}` },
    description: seo.description,
    keywords: seo.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    openGraph: {
      type: "website", locale: locale === "nl" ? "nl_NL" : "en_NL", siteName: site.company.name, title: seo.defaultTitle, description: site.company.tagline,
      ...(seo.socialImage ? { images: [{ url: seo.socialImage }] } : {}),
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog();
  const companyInfo = catalog.site.company;
  const professionalServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: companyInfo.name,
    description: catalog.site.seo.description,
    url: siteUrl,
    areaServed: "NL",
    founder: {
      "@type": "Person",
      name: companyInfo.founder,
      jobTitle: "Founder",
    },
    sameAs: [companyInfo.linkedin],
    address: {
      "@type": "PostalAddress",
      addressCountry: "NL",
    },
  };

  return (
    <html lang={catalog.locale} suppressHydrationWarning>
      <body className={`${manrope.variable} ${inter.variable} ${jetbrains.variable} antialiased`}>
        <JsonLd data={professionalServiceJsonLd} />
        <SiteDataProvider data={catalog}>
          <SiteChrome>{children}</SiteChrome>
        </SiteDataProvider>
      </body>
    </html>
  );
}
