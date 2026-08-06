import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import InfoCard from "@/components/InfoCard";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "Supplier Security Assurance and Questionnaire Support",
  description:
    "Help responding to customer cybersecurity questionnaires and demonstrating security maturity — evidence preparation, control-gap identification and remediation roadmaps.",
  alternates: { canonical: "/supplier-security-assurance" },
};

const features = [
  { icon: "FileQuestion", title: "Questionnaire support", description: "Practical help interpreting and accurately answering customer security questionnaires." },
  { icon: "FolderCheck", title: "Evidence preparation", description: "Organising the documentation and evidence needed to support your answers." },
  { icon: "SearchX", title: "Control-gap identification", description: "A clear view of where your current controls may fall short of expectations." },
  { icon: "Route", title: "Remediation roadmap", description: "A prioritised plan to close gaps and strengthen your position with customers." },
];

const faqs = [
  { question: "We just received a long security questionnaire — can you help quickly?", answer: "Yes. We can support you in interpreting and responding accurately, even under time pressure, while flagging any genuine gaps that need attention." },
  { question: "Do you help us actually close identified gaps?", answer: "Yes — we provide a prioritised remediation roadmap, and can support implementation through Managed Security Essentials or Virtual CISO services." },
  { question: "Is this only for large suppliers?", answer: "No. Micro and small suppliers increasingly face these questionnaires too, and this service is scoped to fit organisations of any size." },
];

export default function SupplierAssurancePage() {
  return (
    <>
      <PageHero
        eyebrow="Supplier Security Assurance"
        title="Respond to customer security questionnaires with confidence"
        description="Larger customers increasingly expect suppliers to demonstrate cybersecurity maturity. We help you respond accurately, prepare evidence and close genuine gaps."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Book a Free Discovery Call</Button>
          <Button href="/contact" variant="secondary" size="lg">Request Questionnaire Support</Button>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="What's included" title="Practical support from questionnaire to remediation" />
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
            <SectionHeading align="left" eyebrow="Best suited for" title="Suppliers facing growing expectations" />
            <p className="mt-6 text-text-secondary leading-relaxed">
              Any organisation that supplies larger customers, regulated industries or public-sector bodies,
              and is being asked to demonstrate its cybersecurity maturity as part of due diligence.
            </p>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Outcome" title="Stronger, faster responses to customers" />
            <ul className="mt-6 space-y-4">
              {["Accurate, well-evidenced questionnaire responses", "A clear view of your control gaps", "A practical roadmap to close them", "Greater confidence in customer and partner relationships"].map((item) => (
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
              Turn security questionnaires into a competitive advantage
            </h2>
            <div className="mt-8">
              <Button href="/contact" size="lg">Request Questionnaire Support</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
