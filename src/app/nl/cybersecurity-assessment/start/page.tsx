import type { Metadata } from "next";
import Wizard from "@/components/assessment/Wizard";
import Shell from "@/components/assessment/Shell";
import { paths, strings } from "@/lib/assessment/i18n";

export const metadata: Metadata = {
  title: strings.nl.hub_eyebrow,
  robots: { index: false, follow: true },
  alternates: { canonical: paths.hub("nl") },
};

export default function Page() {
  return (
    <Shell locale="nl" eyebrow={strings.nl.hub_eyebrow} title={strings.nl.hub_title} switchHref={paths.start("en", "general")}>
      <Wizard locale="nl" />
    </Shell>
  );
}
