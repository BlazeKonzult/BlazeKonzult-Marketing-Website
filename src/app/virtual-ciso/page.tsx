import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import InfoCard from "@/components/InfoCard";

export const metadata: Metadata = {
  title: "Virtual CISO Services in the Netherlands",
  description:
    "Part-time senior cybersecurity leadership for Dutch SMEs — strategy, risk reporting, policy development, governance and board reporting without a full-time hire.",
  alternates: { canonical: "/virtual-ciso" },
};

const capabilities = [
  { icon: "Compass", title: "Cybersecurity strategy", description: "A clear, business-aligned direction for your cybersecurity investment and priorities." },
  { icon: "FileBarChart", title: "Risk reporting", description: "Regular, understandable risk reporting for leadership and, where relevant, the board." },
  { icon: "FileText", title: "Policy development", description: "Practical policies and procedures that fit the size and maturity of your organisation." },
  { icon: "Users2", title: "Governance meetings", description: "Structured cadence of governance discussions to keep cybersecurity on the agenda." },
  { icon: "Presentation", title: "Management and board reporting", description: "Executive-ready reporting that translates risk into business terms." },
  { icon: "HandshakeIcon", title: "Supplier and customer assurance", description: "Support responding to due-diligence questions from customers and partners." },
  { icon: "LifeBuoy", title: "Incident preparedness", description: "Guidance to ensure your organisation is ready to respond if something goes wrong." },
  { icon: "CalendarClock", title: "Ongoing monthly advisory", description: "Consistent, scheduled access to senior cybersecurity leadership throughout the year." },
];

const tiers = [
  {
    name: "Foundation",
    description: "For organisations establishing the basics of cybersecurity governance.",
    features: ["Monthly advisory session", "Risk register setup", "Core policy guidance", "Quarterly reporting"],
  },
  {
    name: "Growth",
    description: "For businesses scaling their security practices alongside the organisation.",
    features: ["Everything in Foundation", "Governance meeting cadence", "Supplier assurance support", "Monthly management reporting"],
    featured: true,
  },
  {
    name: "Strategic",
    description: "For organisations needing deeper, board-level cybersecurity leadership.",
    features: ["Everything in Growth", "Board-level reporting", "Strategic roadmap ownership", "Incident-readiness oversight"],
  },
];

export default function VirtualCisoPage() {
  return (
    <>
      <PageHero
        eyebrow="Virtual CISO and Cyber Governance"
        title="Senior cybersecurity leadership without a full-time hire"
        description="A Virtual CISO gives your organisation part-time, senior-level cybersecurity leadership — bringing strategy, structure and accountability without the cost of a full-time role."
      >
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="/contact" size="lg">Discuss Virtual CISO Support</Button>
          <Button href="/contact" variant="secondary" size="lg">Book a Free Discovery Call</Button>
        </div>
      </PageHero>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="What's included" title="Senior guidance across every area of cybersecurity governance" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((item) => (
              <InfoCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading
            eyebrow="Sample service tiers"
            title="Flexible levels of ongoing support"
            description="Every engagement is scoped to your organisation. These sample tiers illustrate typical levels of support — request a tailored proposal for exact scope and terms."
          />
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-2xl p-8 border ${
                  tier.featured
                    ? "border-primary-purple bg-light-lavender shadow-lg lg:-translate-y-2"
                    : "border-light-lavender bg-white shadow-sm"
                }`}
              >
                {tier.featured && (
                  <span className="self-start text-xs font-bold uppercase tracking-wide text-white bg-primary-purple rounded-full px-3 py-1 mb-4">
                    Most common
                  </span>
                )}
                <h3 className="text-xl font-bold text-deep-purple">{tier.name}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{tier.description}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-text-dark">
                      <Check size={18} className="text-resilience-teal shrink-0 mt-0.5" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                {/* No fixed pricing displayed — proposal is tailored per engagement */}
                <Button href="/contact" variant={tier.featured ? "primary" : "secondary"} className="mt-8 w-full">
                  Request a tailored proposal
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="gradient-purple-soft border border-light-lavender rounded-3xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-deep-purple max-w-2xl mx-auto">
              Ready for senior cybersecurity leadership on your team?
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              Let&apos;s discuss what Virtual CISO support could look like for your organisation.
            </p>
            <div className="mt-8">
              <Button href="/contact" size="lg">Discuss Virtual CISO Support</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
