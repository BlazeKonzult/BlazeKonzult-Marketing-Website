import type { Metadata } from "next";
import Results from "@/components/assessment/Results";
import Shell from "@/components/assessment/Shell";
import { paths, strings } from "@/lib/assessment/i18n";

export const metadata: Metadata = {
  title: strings.nl.results_eyebrow,
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <Shell locale="nl" eyebrow={strings.nl.results_eyebrow} title={strings.nl.hub_title} switchHref={paths.results("en")}>
      <Results locale="nl" />
    </Shell>
  );
}
