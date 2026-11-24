import type { Metadata } from "next";
import Results from "@/components/assessment/Results";
import Shell from "@/components/assessment/Shell";
import { paths, strings } from "@/lib/assessment/i18n";

export const metadata: Metadata = {
  title: strings.en.results_eyebrow,
  robots: { index: false, follow: false, nocache: true },
};

export default function Page() {
  return (
    <Shell locale="en" eyebrow={strings.en.results_eyebrow} title={strings.en.hub_title} switchHref={paths.results("nl")}>
      <Results locale="en" />
    </Shell>
  );
}
