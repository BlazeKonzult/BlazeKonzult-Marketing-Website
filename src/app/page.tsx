import type { Metadata } from "next";
import { ShieldCheck, ActivitySquare, Radar, TrendingUp } from "lucide-react";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import CredibilityStrip from "@/components/CredibilityStrip";
import InfoCard from "@/components/InfoCard";
import ServiceCard from "@/components/ServiceCard";
import ProcessSteps from "@/components/ProcessSteps";
import IconRenderer from "@/components/IconRenderer";
import TestimonialCard from "@/components/TestimonialCard";
import DotGrid from "@/components/DotGrid";
import StatsStrip from "@/components/StatsStrip";
import {
  problemCards,
  services,
  sectors,
  testimonialPlaceholders,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Cybersecurity Services for Dutch SMEs",
  description:
    "Practical cybersecurity support for Dutch MSMEs — health checks, NIS2 readiness, virtual CISO support, awareness training and incident response readiness. Book a free discovery call.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-purple-soft">
        <DotGrid />
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-bright-violet/10 blur-3xl motion-safe:animate-slow-pan"
        />
        <div className="container-page relative py-16 sm:py-24 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div className="animate-fade-up">
            <p className="text-xs font-bold text-primary-purple uppercase tracking-widest mb-5">
              Cybersecurity Consulting · The Netherlands
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-deep-purple leading-[1.03]">
              Cybersecurity support for Dutch MSMEs that need practical protection, compliance
              readiness and trusted guidance.
            </h1>
            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-xl">
              BlazeKonzult helps small and medium-sized organisations understand cyber risk,
              improve security controls, prepare for NIS2 and GDPR expectations, and respond
              confidently to customer security requirements.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button href="/contact" size="lg">
                Book a Free Discovery Call
              </Button>
              <Button href="/cybersecurity-health-check" variant="secondary" size="lg">
                Request a Cybersecurity Health Check
              </Button>
            </div>
            <p className="mt-5 text-sm text-text-secondary max-w-md">
              Senior-led cybersecurity guidance for Dutch SMEs, growing businesses and regulated
              supply-chain partners.
            </p>
          </div>

          {/* Hero visual: abstract dashboard-style resilience graphic, no hacker imagery */}
          <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="relative bg-white rounded-3xl shadow-xl border border-light-lavender p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg gradient-purple flex items-center justify-center">
                    <ShieldCheck size={18} className="text-white" aria-hidden="true" />
                  </div>
                  <span className="font-heading font-bold text-deep-purple text-sm">
                    Resilience Overview
                  </span>
                </div>
                <span className="text-xs font-semibold text-resilience-teal bg-resilience-teal-light rounded-full px-3 py-1">
                  Stable
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl bg-light-lavender p-4">
                  <div className="flex items-center gap-2 text-primary-purple mb-2">
                    <Radar size={16} aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Risk Posture</span>
                  </div>
                  <p className="text-2xl font-bold text-deep-purple">Improving</p>
                </div>
                <div className="rounded-xl bg-light-lavender p-4">
                  <div className="flex items-center gap-2 text-primary-purple mb-2">
                    <ActivitySquare size={16} aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Readiness</span>
                  </div>
                  <p className="text-2xl font-bold text-deep-purple">72%</p>
                </div>
              </div>

              <div className="rounded-xl border border-light-lavender p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    90-Day Roadmap
                  </span>
                  <TrendingUp size={16} className="text-resilience-teal" aria-hidden="true" />
                </div>
                <div className="space-y-2.5">
                  {["Baseline review complete", "Priority controls in progress", "Awareness training scheduled"].map(
                    (label, i) => (
                      <div key={label} className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            i === 0 ? "bg-resilience-teal" : "bg-bright-violet"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="text-xs text-text-secondary">{label}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            {/* PLACEHOLDER: this abstract dashboard graphic may be replaced with real branded illustration/photography later */}
          </div>
        </div>
      </section>

      <CredibilityStrip />

      <StatsStrip />

      {/* Problem section */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why it matters"
            title="Cyber risk is now a business risk"
            description="Phishing, ransomware, cloud misconfiguration, supplier assessments, data protection requirements and customer security questions affect businesses of every size. However, many growing organisations cannot justify hiring a full-time cybersecurity leader."
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {problemCards.map((card) => (
              <InfoCard key={card.title} icon={card.icon} title={card.title} description={card.description} />
            ))}
          </div>
        </div>
      </section>

      {/* Solution / featured services */}
      <section className="py-20 sm:py-28 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our approach"
            title="Practical cybersecurity support built around your business"
            description="BlazeKonzult provides fixed-scope assessments, practical roadmaps, virtual CISO support, awareness training, managed security guidance and incident-response preparation designed for smaller organisations."
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services
              .filter((service) => service.slug !== "supplier-security-assurance")
              .map((service) => (
                <ServiceCard key={service.slug} service={service} showDeliverables />
              ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="A simple, four-step process" />
          <div className="mt-16">
            <ProcessSteps />
          </div>
        </div>
      </section>

      {/* Sector section */}
      <section className="py-20 sm:py-28 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading
            eyebrow="Who we help"
            title="Cybersecurity support for digitally dependent organisations"
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className="bg-white rounded-2xl border border-light-lavender p-6 shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-light-lavender flex items-center justify-center mb-4">
                  <IconRenderer name={sector.icon} size={20} className="text-primary-purple" />
                </div>
                <h3 className="font-bold text-deep-purple mb-1.5">{sector.name}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{sector.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow="Client feedback"
            title="Trusted by growing Dutch businesses"
            description="Sample placeholder content shown below. Real client testimonials and anonymised case studies will replace these cards as they become available."
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonialPlaceholders.map((t) => (
              <TestimonialCard key={t.label} label={t.label} quote={t.quote} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="relative overflow-hidden gradient-purple-soft border border-light-lavender rounded-3xl p-10 sm:p-16 text-center">
            <DotGrid />
            <h2 className="relative text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.08] text-deep-purple max-w-2xl mx-auto">
              Not sure where to begin? Start with a Cybersecurity Health Check.
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              Receive a clear view of your priority risks and a practical 90-day cybersecurity
              improvement plan.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg">
                Book a Free Discovery Call
              </Button>
              <Button href="/cybersecurity-health-check" variant="secondary" size="lg">
                Request a Health Check
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
