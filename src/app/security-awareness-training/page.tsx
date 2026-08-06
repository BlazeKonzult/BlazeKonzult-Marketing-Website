import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import InfoCard from "@/components/InfoCard";
import FAQAccordion from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "Phishing Awareness Training Netherlands",
  description:
    "Practical security awareness and phishing training for Dutch businesses — training sessions, phishing simulations, awareness metrics and coaching.",
  alternates: { canonical: "/security-awareness-training" },
};

const features = [
  { icon: "Presentation", title: "Employee training session", description: "Engaging, practical sessions that help staff recognise common cyber threats." },
  { icon: "Fish", title: "Phishing simulation", description: "Realistic, controlled simulations to measure and build genuine awareness." },
  { icon: "BarChart3", title: "Awareness metrics", description: "Clear reporting on participation and improvement over time." },
  { icon: "MessageSquareHeart", title: "Coaching recommendations", description: "Supportive, non-punitive guidance for individuals and teams who need it." },
];

const faqs = [
  { question: "Will this embarrass employees who fall for a simulation?", answer: "No. Our approach is supportive and educational, not punitive. The goal is to build confidence and awareness, not single out individuals." },
  { question: "How often should training happen?", answer: "We typically recommend an initial session followed by periodic simulations and refreshers, tailored to your organisation's needs and risk profile." },
  { question: "Is this only about phishing emails?", answer: "Phishing is a major focus, but training also covers broader social engineering and business email compromise awareness." },
];

export default function SecurityAwarenessPage() {
  return (
    <>
      <PageHero
        eyebrow="Security Awareness and Phishing Training"
        title="Help your team recognise threats before they become incidents"
        description="Employees are often the first line of defence. Practical, engaging training helps them recognise phishing, social engineering and business email compromise with confidence."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Book a Free Discovery Call</Button>
          <Button href="/contact" variant="secondary" size="lg">Request a Tailored Proposal</Button>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="What's included" title="Training designed to genuinely change behaviour" />
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
            <SectionHeading align="left" eyebrow="Best suited for" title="Teams of any size" />
            <p className="mt-6 text-text-secondary leading-relaxed">
              Any organisation that relies on email and everyday digital tools — which is nearly every
              business today — benefits from a more alert, confident workforce.
            </p>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Outcome" title="A more resilient first line of defence" />
            <ul className="mt-6 space-y-4">
              {["Employees who recognise and report suspicious activity", "Reduced likelihood of successful phishing attempts", "Clear, measurable awareness progress", "A calmer, more confident team culture around security"].map((item) => (
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
              Build a team that spots threats before they spread
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
