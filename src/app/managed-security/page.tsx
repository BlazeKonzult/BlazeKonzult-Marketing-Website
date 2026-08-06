import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import InfoCard from "@/components/InfoCard";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "Managed Security Essentials for SMEs",
  description:
    "Ongoing cybersecurity oversight and improvement coordination for Dutch SMEs — monthly reviews, vulnerability follow-up and cloud security review coordination.",
  alternates: { canonical: "/managed-security" },
};

const features = [
  { icon: "CalendarCheck2", title: "Monthly security review", description: "A recurring review of your security posture, priorities and open items." },
  { icon: "ListTodo", title: "Improvement tracker", description: "A living record of recommended improvements and their progress over time." },
  { icon: "BugOff", title: "Vulnerability follow-up", description: "Coordination to ensure identified vulnerabilities are tracked through to resolution." },
  { icon: "CloudCog", title: "Cloud security review coordination", description: "Regular attention to the configuration and security of your cloud environments." },
];

const faqs = [
  { question: "How is this different from a Health Check?", answer: "A Health Check is a one-time assessment. Managed Security Essentials provides ongoing, recurring oversight to keep improving your posture over time." },
  { question: "Do you replace our existing IT provider?", answer: "No — we typically work alongside your existing IT provider or MSP, focusing on security oversight and coordination rather than day-to-day IT support." },
  { question: "Is this suitable for very small businesses?", answer: "Yes. The service is scoped to your size and needs, so smaller organisations receive a lighter-touch version of the same ongoing attention." },
];

export default function ManagedSecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Managed Security Essentials"
        title="Ongoing cybersecurity oversight, without the overhead of a full team"
        description="Cybersecurity is not a one-time project. Managed Security Essentials provides continuous oversight and coordination to keep your organisation moving in the right direction."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Book a Free Discovery Call</Button>
          <Button href="/contact" variant="secondary" size="lg">Request a Tailored Proposal</Button>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="What's included" title="Continuous attention to what matters most" />
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
            <SectionHeading align="left" eyebrow="Best suited for" title="Businesses that want steady progress" />
            <p className="mt-6 text-text-secondary leading-relaxed">
              Managed Security Essentials suits organisations that have completed an initial assessment —
              such as a Cybersecurity Health Check — and want ongoing coordination to implement and sustain
              improvements, without building an internal security team.
            </p>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Outcome" title="Measurable, steady improvement" />
            <ul className="mt-6 space-y-4">
              {["Consistent visibility of your security posture", "Fewer overlooked vulnerabilities", "Clear tracking of improvement over time", "A trusted point of contact for security questions"].map((item) => (
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
              Keep your cybersecurity moving forward, month after month
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
