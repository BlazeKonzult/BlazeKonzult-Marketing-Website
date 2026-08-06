import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCTA from "@/components/StickyCTA";
import CookieBanner from "@/components/CookieBanner";
import JsonLd from "@/components/JsonLd";
import { companyInfo } from "@/lib/data";

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

// PLACEHOLDER: update siteUrl to the production domain before launch.
const siteUrl = "https://www.blazekonzult.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BlazeKonzult | Cybersecurity Services for Dutch SMEs",
    template: "%s | BlazeKonzult",
  },
  description:
    "BlazeKonzult provides practical cybersecurity guidance for Dutch SMEs — health checks, NIS2 readiness, virtual CISO support, awareness training and incident response readiness.",
  keywords: [
    "cybersecurity services Netherlands",
    "cybersecurity for SMEs Netherlands",
    "NIS2 readiness Netherlands",
    "virtual CISO Netherlands",
    "cybersecurity health check",
  ],
  openGraph: {
    type: "website",
    locale: "en_NL",
    siteName: "BlazeKonzult",
    title: "BlazeKonzult | Cybersecurity Services for Dutch SMEs",
    description: "Clear advice. Practical action. Stronger resilience.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const professionalServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "BlazeKonzult",
    description:
      "Practical cybersecurity consulting for Dutch SMEs, including health checks, NIS2 readiness, virtual CISO support, awareness training and incident response readiness.",
    url: siteUrl,
    areaServed: "NL",
    founder: {
      "@type": "Person",
      name: companyInfo.founder,
      jobTitle: "Founder",
    },
    // PLACEHOLDER: add real address, telephone and email once available
    address: {
      "@type": "PostalAddress",
      addressCountry: "NL",
    },
  };

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} antialiased bg-bg-offwhite text-text-dark`}>
        <JsonLd data={professionalServiceJsonLd} />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <StickyCTA />
        <CookieBanner />
      </body>
    </html>
  );
}
