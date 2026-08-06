import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import { companyInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Responsible Disclosure",
  description: "How to responsibly report a security vulnerability found on the BlazeKonzult website or systems.",
  alternates: { canonical: "/responsible-disclosure" },
};

export default function ResponsibleDisclosurePage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Responsible Disclosure"
        description="As a cybersecurity organisation, we take the security of our own systems seriously and welcome responsible reports from the security community."
      />
      <section className="py-16 sm:py-20">
        <div className="container-page max-w-3xl space-y-8 text-text-secondary leading-relaxed">
          <div className="flex items-start gap-3 bg-light-lavender rounded-xl p-5">
            <ShieldCheck size={22} className="text-primary-purple shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-text-dark">
              If you believe you have discovered a security vulnerability in our website or systems,
              we ask that you report it to us responsibly, in line with the guidance below.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">What we ask</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Report the issue promptly and privately, without publicly disclosing it first.</li>
              <li>Provide enough detail for us to reproduce and understand the issue.</li>
              <li>Avoid accessing, modifying or deleting data that does not belong to you.</li>
              <li>Do not perform testing that could disrupt our services or affect other users.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">How to report</h2>
            <p>
              {/* PLACEHOLDER: insert dedicated security-reporting email address, ideally supporting PGP encryption */}
              Please send reports to {companyInfo.email} (PLACEHOLDER — replace with a dedicated
              security contact address) with as much detail as possible.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-deep-purple mb-3">What you can expect from us</h2>
            <p>
              We aim to acknowledge reports promptly, investigate in good faith, and keep you
              informed of progress. PLACEHOLDER — confirm target acknowledgement and resolution
              timeframes once formalised.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
