import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import InfoCard from "@/components/InfoCard";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "Incident Response Readiness for Dutch Businesses",
  description:
    "Prepare for ransomware, data breaches, account compromise and business disruption with a tested incident-response plan, tabletop exercises and backup review.",
  alternates: { canonical: "/incident-response-readiness" },
};

const features = [
  { icon: "FileText", title: "Incident-response plan", description: "A clear, practical plan tailored to your organisation's systems and priorities." },
  { icon: "Users2", title: "Tabletop exercise", description: "A guided walkthrough of a realistic scenario to test your plan and team readiness." },
  { icon: "DatabaseBackup", title: "Backup and recovery review", description: "An honest assessment of whether your backups would actually support recovery." },
  { icon: "ListTree", title: "Escalation checklist", description: "A clear, simple checklist for who to contact and what to do first." },
];

const faqs = [
  { question: "Does this mean you handle live incidents for us?", answer: "This service focuses on readiness and preparation — building your plan, testing it and identifying gaps — so your organisation can respond calmly and effectively if an incident occurs." },
  { question: "What is a tabletop exercise?", answer: "A structured, discussion-based session where your team walks through how they would respond to a realistic incident scenario, without any live systems being affected." },
  { question: "We already have backups — is this still useful?", answer: "Having backups and being able to recover quickly and completely are not always the same thing. A backup and recovery review checks that assumption." },
];

export default function IncidentResponsePage() {
  return (
    <>
      <PageHero
        eyebrow="Incident Response Readiness"
        title="Prepare to respond with confidence, not confusion"
        description="No organisation can eliminate all risk. What matters is being ready to respond calmly and effectively — protecting your business, your customers and your reputation."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Book a Free Discovery Call</Button>
          <Button href="/contact" variant="secondary" size="lg">Request a Tailored Proposal</Button>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="What's included" title="Practical preparation, not fear-based messaging" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <InfoCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <SectionHeading align="left" eyebrow="Best suited for" title="Organisations that want to be ready" />
            <p className="mt-6 text-text-secondary leading-relaxed">
              Any organisation that depends on its systems, data or reputation — which is most businesses
              today — benefits from having a tested plan in place before an incident occurs.
            </p>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Outcome" title="A calmer, faster response when it matters" />
            <ul className="mt-6 space-y-4">
              {["A tested, realistic response plan", "Clear roles and escalation paths", "Confidence that backups will actually work", "Reduced disruption and faster recovery"].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-resilience-teal shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
          <div className="mt-12">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-white border-t border-light-lavender">
        <div className="container-page">
          <div className="gradient-purple-soft border border-light-lavender rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-deep-purple max-w-2xl mx-auto">
              Build the confidence to respond, not just react
            </h2>
            <div className="mt-8">
              <Button href="/contact" size="lg">Request a Tailored Proposal</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
