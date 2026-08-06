import type { Metadata } from "next";
import { CheckCircle2, Info } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import InfoCard from "@/components/InfoCard";
import FAQAccordion from "@/components/FAQAccordion";
import LeadMagnetForm from "@/components/LeadMagnetForm";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "NIS2 Readiness for Dutch Organisations and Suppliers",
  description:
    "Readiness guidance for NIS2 and the Dutch Cybersecurity Act: applicability screening, gap assessment, governance recommendations and supplier-readiness support.",
  alternates: { canonical: "/nis2-readiness" },
};

const whoMayBeAffected = [
  { icon: "Building2", title: "Medium and large organisations", description: "In sectors such as energy, transport, healthcare, digital infrastructure and more, that may fall within NIS2 scope." },
  { icon: "Truck", title: "Suppliers and vendors", description: "Businesses that supply products or services to organisations that are themselves in scope of NIS2." },
  { icon: "Server", title: "IT and digital service providers", description: "Managed service providers and digital infrastructure businesses that support essential or important entities." },
  { icon: "FileCheck2", title: "Businesses facing new customer requirements", description: "Organisations already being asked by customers to demonstrate stronger cybersecurity governance." },
];

const readinessAreas = [
  { icon: "ClipboardCheck", title: "Applicability screening", description: "A structured review to help you understand whether NIS2 or related obligations may apply to your organisation." },
  { icon: "Scale", title: "Governance and risk requirements", description: "Guidance on the governance, risk-management and accountability expectations associated with NIS2." },
  { icon: "LifeBuoy", title: "Incident preparedness", description: "Support to help you understand incident-reporting expectations and build practical response readiness." },
  { icon: "Network", title: "Supply-chain security", description: "Guidance on assessing and managing cybersecurity risk introduced through your suppliers and partners." },
];

const faqs = [
  {
    question: "Does NIS2 apply to my organisation?",
    answer:
      "It depends on your sector, size and role in the supply chain. Many smaller organisations are not directly in scope but may face NIS2-related requirements from larger customers. An applicability screening helps clarify your specific situation.",
  },
  {
    question: "What is the Dutch Cybersecurity Act?",
    answer:
      "It is the Dutch legislation implementing the EU NIS2 Directive. Requirements and enforcement details may evolve, so we provide readiness guidance rather than definitive legal interpretation.",
  },
  {
    question: "We are a supplier, not directly regulated — does this still matter to us?",
    answer:
      "Potentially, yes. Regulated organisations are increasingly expected to assess the cybersecurity practices of their suppliers, so demonstrating readiness can become a competitive and commercial advantage.",
  },
  {
    question: "Can BlazeKonzult confirm our legal obligations?",
    answer:
      "We provide practical readiness guidance based on publicly available regulatory information. For definitive legal interpretation, we recommend also consulting qualified legal counsel.",
  },
];

export default function Nis2ReadinessPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />

      <PageHero
        eyebrow="NIS2 and Dutch Cybersecurity Act Readiness"
        title="Prepare your organisation and supply chain for increasing cybersecurity expectations"
        description="NIS2 and the Dutch Cybersecurity Act may introduce new cybersecurity obligations for many organisations and their suppliers. We help you understand what may apply and take practical readiness steps."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Request a NIS2 Readiness Assessment</Button>
          <Button href="#supplier-checklist" variant="secondary" size="lg">Get the Supplier Checklist</Button>
        </div>
      </PageHero>

      {/* Explanation */}
      <section className="py-16 sm:py-20">
        <div className="container-page grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <SectionHeading align="left" eyebrow="What is NIS2" title="A broader push toward cyber resilience" />
          </div>
          <div className="lg:col-span-2 text-text-secondary leading-relaxed space-y-4">
            <p>
              NIS2 is an EU directive intended to raise the level of cybersecurity across a wide range of
              sectors. In the Netherlands, it is expected to be implemented through the Dutch Cybersecurity
              Act (Cyberbeveiligingswet). Requirements may include governance obligations, risk-management
              measures, incident reporting and supply-chain security expectations.
            </p>
            <div className="flex items-start gap-3 bg-light-lavender rounded-xl p-4 mt-4">
              <Info size={20} className="text-primary-purple shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-text-dark">
                This page provides general readiness guidance, not legal advice. Specific obligations may
                apply depending on your sector, size and role in the supply chain — always confirm your
                exact position with qualified legal counsel where needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who may be affected */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading eyebrow="Who may be affected" title="Organisations and suppliers that may be in scope" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whoMayBeAffected.map((item) => (
              <InfoCard key={item.title} icon={item.icon} title={item.title} description={item.description} accent="teal" />
            ))}
          </div>
        </div>
      </section>

      {/* Readiness areas */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="How we help" title="Practical readiness guidance across four areas" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {readinessAreas.map((item) => (
              <InfoCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      {/* Gap assessment process + deliverables */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page grid lg:grid-cols-2 gap-14">
          <div>
            <SectionHeading align="left" eyebrow="Gap-assessment process" title="How a readiness engagement works" />
            <ol className="mt-8 space-y-5">
              {[
                "Applicability screening to understand your potential position under NIS2 and related requirements",
                "Structured gap assessment against governance, risk and incident-management expectations",
                "Supply-chain review covering key suppliers and partners",
                "Practical recommendations and a prioritised readiness roadmap",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full gradient-purple text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-text-secondary pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Deliverables" title="What you receive" />
            <ul className="mt-8 space-y-4">
              {["Applicability screening", "Gap assessment", "Governance recommendations", "Supplier-readiness checklist"].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-resilience-teal shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Supplier checklist CTA */}
      <section id="supplier-checklist" className="py-20 sm:py-28 gradient-purple scroll-mt-24">
        <div className="container-page grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80 mb-4">Free Resource</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">NIS2 Supplier Readiness Checklist</h2>
            <p className="mt-4 text-white/85 leading-relaxed max-w-md">
              A practical checklist to help suppliers prepare for growing customer cybersecurity expectations
              linked to NIS2 and related regulation.
            </p>
          </div>
          <div>
            <LeadMagnetForm resourceName="NIS2 Supplier Readiness Checklist" buttonLabel="Download the Supplier Checklist" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
          <div className="mt-12">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* Consultation form */}
      <section className="py-16 sm:py-20 bg-white border-t border-light-lavender">
        <div className="container-page max-w-2xl text-center">
          <SectionHeading eyebrow="Next step" title="Request a NIS2 readiness consultation" />
          <p className="mt-4 text-text-secondary">
            Speak with a cybersecurity adviser about your organisation&apos;s potential NIS2 position and a
            practical path toward readiness.
          </p>
          <div className="mt-8">
            <Button href="/contact" size="lg">Request a NIS2 Readiness Assessment</Button>
          </div>
        </div>
      </section>
    </>
  );
}
