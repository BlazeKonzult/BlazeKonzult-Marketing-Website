import type { Metadata } from "next";
import Wizard from "@/components/assessment/Wizard";
import Shell from "@/components/assessment/Shell";
import { paths, strings } from "@/lib/assessment/i18n";

export const metadata: Metadata = {
  title: strings.en.hub_eyebrow,
  robots: { index: false, follow: true },
  alternates: { canonical: paths.hub("en") },
};

export default function Page() {
  return (
    <Shell locale="en" eyebrow={strings.en.hub_eyebrow} title={strings.en.hub_title} switchHref={paths.start("nl", "general")}>
      <Wizard locale="en" />
    </Shell>
  );
}
