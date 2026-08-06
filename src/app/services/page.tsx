import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cybersecurity Services for Dutch SMEs",
  description:
    "Explore BlazeKonzult's cybersecurity services: health checks, NIS2 readiness, virtual CISO support, managed security, awareness training, incident response and supplier assurance.",
  alternates: { canonical: "/services" },
};

const categories = ["Assess", "Prepare", "Govern", "Educate", "Respond", "Improve"] as const;

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Cybersecurity services built for growing Dutch businesses"
        description="Every engagement is scoped around your business — not a generic checklist. Explore our services below, grouped by what they help you do."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Book a Free Discovery Call</Button>
          <Button href="/cybersecurity-health-check" variant="secondary" size="lg">Request a Health Check</Button>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap justify-center gap-2 mb-14" aria-label="Service categories">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-semibold uppercase tracking-wide text-primary-purple bg-light-lavender rounded-full px-4 py-2"
              >
                {cat}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} showDeliverables />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison section */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading
            eyebrow="Not sure which service fits?"
            title="Compare services at a glance"
            description="Use this overview to identify the best starting point for your organisation. Most clients begin with a Cybersecurity Health Check."
          />
          <div className="mt-14 overflow-x-auto">
            <table className="w-full border-collapse min-w-[720px]">
              <caption className="sr-only">Comparison of BlazeKonzult cybersecurity services</caption>
              <thead>
                <tr className="border-b-2 border-light-lavender">
                  <th scope="col" className="text-left py-4 pr-4 text-sm font-bold text-deep-purple">Service</th>
                  <th scope="col" className="text-left py-4 px-4 text-sm font-bold text-deep-purple">Best suited for</th>
                  <th scope="col" className="text-left py-4 px-4 text-sm font-bold text-deep-purple">Category</th>
                  <th scope="col" className="text-left py-4 pl-4 text-sm font-bold text-deep-purple">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.slug} className="border-b border-light-lavender">
                    <th scope="row" className="text-left py-4 pr-4 font-semibold text-text-dark whitespace-nowrap">
                      <Link href={s.href} className="hover:text-primary-purple">{s.name}</Link>
                    </th>
                    <td className="py-4 px-4 text-sm text-text-secondary">{s.bestSuitedFor}</td>
                    <td className="py-4 px-4 text-sm text-text-secondary">{s.category}</td>
                    <td className="py-4 pl-4 text-sm text-text-secondary">{s.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="gradient-purple-soft border border-light-lavender rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-deep-purple max-w-2xl mx-auto">
              Still unsure which service is right for you?
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              Talk to a cybersecurity adviser and we&apos;ll help you find the most practical starting point.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg" icon={<ArrowRight size={18} aria-hidden="true" />}>
                Talk to a Cybersecurity Adviser
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
