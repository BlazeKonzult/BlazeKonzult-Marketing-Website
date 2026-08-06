import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { companyInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How BlazeKonzult uses cookies and similar technologies on this website.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Cookie Policy" description="Last updated: PLACEHOLDER — insert publication date." />
      <section className="py-16 sm:py-20">
        <div className="container-page max-w-3xl space-y-8 text-text-secondary leading-relaxed">
          {/* PLACEHOLDER: replace with legally reviewed cookie policy content, including a full,
              accurate cookie inventory once analytics and other tools are finalised. */}
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">1. What are cookies</h2>
            <p>
              Cookies are small text files placed on your device to help websites function and, in
              some cases, to gather anonymous usage information.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">2. Essential cookies</h2>
            <p>
              Essential cookies are necessary for the website to function correctly (for example,
              remembering your cookie consent choice) and do not require consent under Dutch and EU
              rules.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">3. Optional analytics cookies</h2>
            <p>
              With your consent, we may use privacy-conscious analytics tools to understand how
              visitors use this website, helping us improve content and navigation. PLACEHOLDER —
              name the specific analytics provider(s) used once finalised.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">4. Managing your preferences</h2>
            <p>
              You can accept or reject non-essential cookies using the banner shown when you first
              visit this site, and can update your browser settings to control cookies more broadly
              at any time.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">5. Contact us</h2>
            <p>Questions about this policy can be sent to {companyInfo.email} (PLACEHOLDER).</p>
          </div>
        </div>
      </section>
    </>
  );
}
