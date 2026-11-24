import type { Metadata } from "next";
import Hub from "@/components/assessment/Hub";
import { strings } from "@/lib/assessment/i18n";

const t = strings.en;
export const metadata: Metadata = {
  title: { absolute: `${t.hub_title} | Free Cybersecurity Assessment | BlazeKonzult` },
  description: t.hub_lead.split(". ").slice(0, 2).join(". ") + ".",
  alternates: { canonical: "/cybersecurity-assessment/", languages: { en: "/cybersecurity-assessment/", nl: "/nl/cybersecurity-assessment/", "x-default": "/cybersecurity-assessment/" } },
  openGraph: { title: t.hub_title, description: t.hub_lead, locale: "en_NL" },
};

export default function Page() {
  return <Hub locale="en" />;
}
