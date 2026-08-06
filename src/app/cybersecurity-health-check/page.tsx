import type { Metadata } from "next";
import { CheckCircle2, FileText, Target, Users2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import FAQAccordion from "@/components/FAQAccordion";
import InfoCard from "@/components/InfoCard";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Cybersecurity Health Check for SMEs",
  description:
    "A fixed-scope Cybersecurity Health Check for Dutch SMEs: baseline maturity review, risk summary, executive report and a prioritised 90-day action plan.",
  alternates: { canonical: "/cybersecurity-health-check" },
};

const reviewAreas = [
  { icon: "Laptop2", title: "IT and cloud environment", description: "Core systems, email, cloud platforms and everyday tools your business relies on." },
  { icon: "Users", title: "Access and identity", description: "Who has access to what, and whether that access is appropriately controlled." },
  { icon: "ShieldCheck", title: "Security controls", description: "The safeguards currently in place, from backups to endpoint protection." },
  { icon: "FileWarning", title: "Policies and processes", description: "Existing documentation, incident plans and day-to-day security practices." },
  { icon: "Building2", title: "Third-party and supplier risk", description: "Exposure introduced through vendors, partners and connected systems." },
  { icon: "Scale", title: "Regulatory context", description: "Awareness of GDPR and any potential NIS2-related expectations relevant to you." },
];

const processSteps = [
  { title: "Scoping call", description: "We agree the scope, systems and stakeholders involved in the review." },
  { title: "Structured review", description: "We assess your environment, controls and practices against recognised good practice." },
  { title: "Risk analysis", description: "Findings are translated into plain-language business risk, not just technical jargon." },
  { title: "Executive report", description: "You receive a clear report and a prioritised 90-day action plan." },
];

const faqs = [
  {
    question: "Who is the Health Check for?",
    answer:
      "Any organisation that is unsure of its current cybersecurity maturity — from micro-businesses to mid-sized companies — and wants a clear, practical starting point.",
  },
  {
    question: "How long does it take?",
    answer:
      "Most Health Checks are completed within a few weeks from the scoping call to the final report, depending on the size and complexity of your organisation.",
  },
  {
    question: "Do we need technical staff involved?",
    answer:
      "It helps to have someone who knows your IT setup available for a short discussion, but the report itself is written for business leaders, not just technical teams.",
  },
  {
    question: "What happens after the Health Check?",
    answer:
      "You receive a prioritised 90-day action plan. Many clients then choose ongoing support such as Managed Security Essentials or Virtual CISO guidance to implement it.",
  },
];

export default function HealthCheckPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Cybersecurity Health Check", item: "/cybersecurity-health-check" },
    ],
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero
        eyebrow="Cybersecurity Health Check"
        title="Understand your cyber risk and know what to improve first"
        description="A fixed-scope review of your organisation's current cybersecurity posture, priority risks and recommended improvements — explained in plain business language."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="#request-form" size="lg">Request a Cybersecurity Health Check</Button>
          <Button href="/contact" variant="secondary" size="lg">Book a Free Discovery Call</Button>
        </div>
      </PageHero>

      {/* Who it's for */}
      <section className="py-16 sm:py-20">
        <div className="container-page grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <SectionHeading align="left" eyebrow="Who it's for" title="A practical starting point for any growing business" />
          </div>
          <div className="lg:col-span-2 text-text-secondary leading-relaxed space-y-4">
            <p>
              The Cybersecurity Health Check is designed for organisations that are unsure of their current
              cybersecurity maturity and want a clear, independent view — without committing to a large
              programme of work.
            </p>
            <p>
              It suits micro, small and medium-sized businesses across sectors, including those responding
              to customer security requirements for the first time, and those simply looking to reduce risk
              with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* What is reviewed */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading eyebrow="What is reviewed" title="A structured look across your organisation" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewAreas.map((area) => (
              <InfoCard key={area.title} icon={area.icon} title={area.title} description={area.description} />
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="The process" title="From scoping call to action plan" />
          <ol className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <li key={step.title} className="bg-white rounded-2xl border border-light-lavender p-6 shadow-sm">
                <span className="text-xs font-bold text-resilience-teal uppercase tracking-wide">Step {i + 1}</span>
                <h3 className="mt-2 font-bold text-deep-purple">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Deliverables + roadmap visual */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <SectionHeading align="left" eyebrow="Deliverables" title="What you receive" />
            <ul className="mt-8 space-y-4">
              {["Baseline maturity review", "Risk summary", "Executive report", "Prioritised 90-day action plan"].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-resilience-teal shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Sample roadmap" title="A sample 90-day plan" />
            <div className="mt-8 bg-light-lavender rounded-2xl p-6 space-y-4">
              {[
                { phase: "Days 1–30", focus: "Address urgent, high-impact risks", icon: Target },
                { phase: "Days 31–60", focus: "Strengthen core controls and policies", icon: FileText },
                { phase: "Days 61–90", focus: "Build awareness and long-term resilience", icon: Users2 },
              ].map((row) => (
                <div key={row.phase} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-light-lavender">
                  <row.icon size={20} className="text-primary-purple shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-resilience-teal uppercase tracking-wide">{row.phase}</p>
                    <p className="text-sm text-text-dark font-medium mt-1">{row.focus}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-secondary pt-1">
                Illustrative example only — your actual roadmap will be tailored to your organisation&apos;s findings.
              </p>
            </div>
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

      {/* Request form */}
      <section id="request-form" className="py-16 sm:py-20 bg-white border-t border-light-lavender scroll-mt-24">
        <div className="container-page max-w-2xl">
          <SectionHeading eyebrow="Get started" title="Request your Cybersecurity Health Check" />
          <div className="mt-10 gradient-purple-soft border border-light-lavender rounded-2xl p-6 sm:p-8">
            <p className="text-sm text-text-secondary mb-6">
              Tell us a little about your organisation and a cybersecurity adviser will get back to you to
              confirm scope and next steps. For the full request form, visit our{" "}
              <a href="/contact" className="underline text-primary-purple hover:text-deep-purple">Contact page</a>.
            </p>
            <Button href="/contact" size="lg" className="w-full sm:w-auto">Go to Full Request Form</Button>
          </div>
        </div>
      </section>
    </>
  );
}
