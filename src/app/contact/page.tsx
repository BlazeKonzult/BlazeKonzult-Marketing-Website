import type { Metadata } from "next";
import { Mail, Phone, MapPin, Calendar, ShieldCheck } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import LinkedinIcon from "@/components/LinkedinIcon";
import { companyInfo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact BlazeKonzult",
  description:
    "Get in touch with BlazeKonzult to book a free discovery call, request a Cybersecurity Health Check, or discuss NIS2 readiness and Virtual CISO support.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your organisation's cybersecurity"
        description="Tell us a little about your organisation and a cybersecurity adviser will get back to you — usually within one business day."
      />

      <section className="py-16 sm:py-20">
        <div className="container-page grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-light-lavender shadow-sm p-6 sm:p-10">
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="bg-light-lavender rounded-2xl p-6">
              <h2 className="font-bold text-deep-purple mb-4 flex items-center gap-2">
                <Calendar size={18} aria-hidden="true" /> Prefer to book directly?
              </h2>
              <p className="text-sm text-text-secondary mb-4">
                Use our calendar to schedule a free discovery call at a time that suits you.
              </p>
              {/* PLACEHOLDER: replace with real calendar-booking URL */}
              <a
                href={companyInfo.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-primary-purple text-white font-semibold px-5 py-3 text-sm min-h-11 hover:bg-deep-purple transition-colors"
              >
                Book a Free Discovery Call
              </a>
            </div>

            <div className="bg-white border border-light-lavender rounded-2xl p-6">
              <h2 className="font-bold text-deep-purple mb-4">Direct contact</h2>
              <ul className="space-y-3 text-sm text-text-secondary">
                <li className="flex items-start gap-2.5">
                  <Mail size={16} className="mt-0.5 shrink-0 text-primary-purple" aria-hidden="true" />
                  {/* PLACEHOLDER: business email */}
                  <span>{companyInfo.email}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone size={16} className="mt-0.5 shrink-0 text-primary-purple" aria-hidden="true" />
                  {/* PLACEHOLDER: business phone number */}
                  <span>{companyInfo.phone}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-primary-purple" aria-hidden="true" />
                  <span>{companyInfo.serviceArea}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <LinkedinIcon size={16} className="mt-0.5 shrink-0 text-primary-purple" />
                  {/* PLACEHOLDER: LinkedIn company URL */}
                  <a href={companyInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary-purple underline">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-white border border-light-lavender rounded-2xl p-6">
              <h2 className="font-bold text-deep-purple mb-3 flex items-center gap-2">
                <ShieldCheck size={18} aria-hidden="true" className="text-resilience-teal" /> Your privacy
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Information you share with us is used only to respond to your enquiry and is handled in
                line with our{" "}
                <a href="/privacy-policy" className="underline hover:text-primary-purple">Privacy Policy</a>.
                We do not sell or share your data with third parties for marketing purposes.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
