import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { companyInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How BlazeKonzult collects, uses and protects personal data, in line with the GDPR.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" description="Last updated: PLACEHOLDER — insert publication date." />
      <section className="py-16 sm:py-20">
        <div className="container-page max-w-3xl prose-content space-y-8 text-text-secondary leading-relaxed">
          {/*
            PLACEHOLDER: This page contains draft, non-final placeholder text only.
            Replace with legally reviewed privacy policy content before launch,
            covering at minimum: data controller identity, legal bases for
            processing (GDPR Art. 6), categories of personal data collected,
            retention periods, data subject rights, use of processors/sub-processors,
            international transfers (if any), and contact details for data
            protection queries.
          */}
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">1. Who we are</h2>
            <p>
              BlazeKonzult (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the data controller for personal
              data collected through this website. PLACEHOLDER — insert registered business name,
              address ({companyInfo.address}) and contact email ({companyInfo.email}).
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">2. What data we collect</h2>
            <p>
              We collect information you provide directly, such as through our contact form,
              consultation-request forms and checklist downloads — including name, company, email
              address, phone number and any message content. PLACEHOLDER — confirm final data
              fields and any analytics data collected.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">3. How we use your data</h2>
            <p>
              We use your data to respond to enquiries, deliver requested resources, and, where you
              have consented, to send occasional cybersecurity guidance. We apply data-minimisation
              principles and do not collect more than necessary for these purposes.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">4. Your rights</h2>
            <p>
              Under the GDPR, you have rights to access, correct, delete and restrict processing of
              your personal data, and to withdraw consent at any time. PLACEHOLDER — insert process
              and contact point for exercising these rights.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">5. Data security</h2>
            <p>
              We apply appropriate technical and organisational measures to protect personal data,
              including secure form handling, access controls and regular review of our systems.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">6. Contact us</h2>
            <p>For any privacy-related questions, contact us at {companyInfo.email} (PLACEHOLDER).</p>
          </div>
        </div>
      </section>
    </>
  );
}
