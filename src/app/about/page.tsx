import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Button from "@/components/Button";
import SectionHeading from "@/components/SectionHeading";
import JsonLd from "@/components/JsonLd";
import { companyInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "About the Founder | Adeiza Johnson Yisa",
  description:
    "Meet Adeiza Johnson Yisa, founder of BlazeKonzult — a senior cybersecurity, information-risk management and digital-resilience professional serving Dutch SMEs.",
  alternates: { canonical: "/about" },
};

const credentials = [
  { code: "CISSP", name: "Certified Information Systems Security Professional" },
  { code: "CISM", name: "Certified Information Security Manager" },
  { code: "CCSP", name: "Certified Cloud Security Professional" },
  { code: "PMP", name: "Project Management Professional" },
  { code: "CEH", name: "Certified Ethical Hacker" },
];

const expertiseAreas = [
  "Cybersecurity governance",
  "IT and OT risk",
  "Information-risk management",
  "Cloud-security considerations",
  "Third-party risk",
  "Security awareness",
  "Incident preparedness",
  "Executive-level cyber-risk reporting",
];

const values = [
  { title: "Clarity over complexity", description: "Cybersecurity guidance should be understandable, not intimidating." },
  { title: "Practical over theoretical", description: "Every recommendation is grounded in what your business can realistically act on." },
  { title: "Partnership over transactions", description: "We aim to be a trusted long-term adviser, not a one-off vendor." },
];

const companyStatements = [
  {
    label: "Mission",
    text: "To make professional cybersecurity accessible, practical and affordable for Dutch MSMEs, helping them protect their data, operations, customers and reputation.",
  },
  {
    label: "Vision",
    text: "To become a trusted cybersecurity partner for Dutch MSMEs by enabling smaller organisations to operate confidently in a digital economy where cyber resilience is essential to business continuity and growth.",
  },
  {
    label: "Purpose",
    text: "To translate enterprise-grade cybersecurity experience into clear, actionable and proportionate security improvements for smaller businesses.",
  },
  {
    label: "Brand promise",
    text: "Clear advice. Practical action. Stronger resilience.",
  },
];

const taglineOptions = [
  "Practical cybersecurity for growing businesses.",
  "Cyber resilience made clear for Dutch SMEs.",
  "Senior cyber expertise, accessible to MSMEs.",
  "Protect your business. Prove your security. Build trust.",
];

export default function AboutPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: companyInfo.founder,
    jobTitle: "Founder, BlazeKonzult",
    worksFor: { "@type": "Organization", name: "BlazeKonzult" },
    hasCredential: credentials.map((c) => ({ "@type": "EducationalOccupationalCredential", name: `${c.code} — ${c.name}` })),
  };

  return (
    <>
      <JsonLd data={personJsonLd} />

      <PageHero eyebrow="About the Founder" title="Enterprise cybersecurity experience, made accessible">
        <div className="mt-8">
          <Button href="/contact" size="lg">Schedule a Conversation</Button>
        </div>
      </PageHero>

      {/* Company overview */}
      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading
            eyebrow="Who we are"
            title="Practical cybersecurity, built for Dutch MSMEs"
            description="BlazeKonzult helps Dutch MSMEs reduce cyber risk, strengthen business resilience and meet growing client, regulatory and supply-chain cybersecurity expectations through practical, affordable and senior-led cybersecurity services."
          />

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {companyStatements.map((item) => (
              <div key={item.label} className="bg-light-lavender rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary-purple mb-3">
                  {item.label}
                </h3>
                <p className="text-text-dark leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white border border-light-lavender rounded-2xl p-6 sm:p-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary-purple mb-4">
              How we describe ourselves
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {taglineOptions.map((tagline) => (
                <li
                  key={tagline}
                  className="text-sm text-text-secondary leading-relaxed bg-light-lavender rounded-xl px-4 py-3"
                >
                  {tagline}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid lg:grid-cols-3 gap-14">
          <div className="lg:col-span-1">
            {/* PLACEHOLDER: insert professional headshot of Adeiza Johnson Yisa */}
            <div
              className="w-full aspect-[4/5] rounded-3xl gradient-purple-soft border border-light-lavender flex items-center justify-center"
              role="img"
              aria-label="Placeholder for founder headshot of Adeiza Johnson Yisa"
            >
              <span className="text-text-secondary text-sm font-medium text-center px-6">
                Founder headshot placeholder
              </span>
            </div>
            <blockquote className="mt-6 border-l-4 border-primary-purple pl-5 italic text-deep-purple font-medium">
              &ldquo;Cybersecurity should give business leaders clarity and confidence — not more
              complexity.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-text-secondary">Adeiza Johnson Yisa, Founder</p>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-deep-purple mb-4">Professional biography</h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                Adeiza Johnson Yisa founded BlazeKonzult to help smaller organisations access
                cybersecurity expertise that is often available only to large enterprises. His
                professional background spans cybersecurity governance, IT and OT risk,
                information-risk management, cloud-security considerations, third-party risk,
                security awareness, incident preparedness and executive-level cyber-risk reporting.
              </p>
              <p>
                Adeiza has advised business leaders, technology teams and risk owners on cyber
                threats, security controls, regulatory expectations, risk acceptance and resilience
                planning. His approach is practical and business aligned: helping organisations
                understand their real risks, prioritise the controls that matter most and build
                confidence with customers, suppliers and regulators.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-deep-purple mt-10 mb-4">Credentials</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {credentials.map((c) => (
                <li key={c.code} className="flex items-baseline gap-2 bg-light-lavender rounded-xl px-4 py-3">
                  <span className="font-bold text-deep-purple">{c.code}</span>
                  <span className="text-sm text-text-secondary">— {c.name}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-2xl font-bold text-deep-purple mt-10 mb-4">Areas of expertise</h2>
            <ul className="flex flex-wrap gap-2">
              {expertiseAreas.map((a) => (
                <li key={a} className="text-sm font-medium text-primary-purple bg-white border border-light-lavender rounded-full px-4 py-2">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white border-y border-light-lavender">
        <div className="container-page">
          <SectionHeading eyebrow="Philosophy and values" title="Cybersecurity philosophy" description="Cybersecurity should give business leaders clarity and confidence — not more complexity. That belief shapes every engagement." />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-light-lavender rounded-2xl p-6">
                <h3 className="font-bold text-deep-purple mb-2">{v.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid lg:grid-cols-2 gap-14">
          <div>
            <SectionHeading align="left" eyebrow="Approach" title="Working with SMEs" />
            <p className="mt-6 text-text-secondary leading-relaxed">
              Every engagement starts with understanding your business — not just your technology.
              Recommendations are prioritised by real-world risk, cost and urgency, so smaller
              organisations can make confident decisions without being overwhelmed.
            </p>
          </div>
          <div className="bg-light-lavender rounded-2xl p-8 flex flex-col justify-center">
            <p className="text-lg font-semibold text-deep-purple mb-4">
              Ready to talk about your organisation&apos;s cybersecurity?
            </p>
            <Button href="/contact" size="lg" className="self-start">Schedule a Conversation</Button>
          </div>
        </div>
      </section>
    </>
  );
}
