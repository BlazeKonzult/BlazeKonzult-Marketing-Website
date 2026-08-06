"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

const companySizes = ["1–10", "11–50", "51–250", "250+"];
const sectorOptions = [
  "Professional services",
  "Logistics",
  "Healthcare or healthtech",
  "Manufacturing",
  "IT or MSP",
  "SaaS or data",
  "Other",
];
const primaryNeeds = [
  "Cybersecurity Health Check",
  "NIS2 readiness",
  "Virtual CISO",
  "Awareness training",
  "Incident readiness",
  "Supplier questionnaire support",
  "Not sure",
];
const urgencyOptions = ["Immediate", "Within 30 days", "Within three months", "Exploring"];

/**
 * Full contact / consultation-request form.
 * PLACEHOLDER: connect to a secure server-side endpoint with server-side
 * validation, spam protection (e.g. honeypot field + rate limiting) and
 * GDPR-compliant storage before going live. Never expose submissions in
 * client-side code, and avoid logging sensitive fields to third parties
 * without a data processing agreement.
 */
export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="bg-light-lavender rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-deep-purple mb-2">Thank you for reaching out</h3>
        <p className="text-text-secondary">
          We aim to respond within one business day. In the meantime, feel free to book a discovery call
          directly using the link above.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-describedby="contact-form-privacy-note">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium text-text-dark mb-1.5">
            Name <span aria-hidden="true">*</span>
          </label>
          <input id="cf-name" name="name" type="text" required autoComplete="name"
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none" />
        </div>
        <div>
          <label htmlFor="cf-company" className="block text-sm font-medium text-text-dark mb-1.5">
            Company <span aria-hidden="true">*</span>
          </label>
          <input id="cf-company" name="company" type="text" required autoComplete="organization"
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-email" className="block text-sm font-medium text-text-dark mb-1.5">
            Business email <span aria-hidden="true">*</span>
          </label>
          <input id="cf-email" name="email" type="email" required autoComplete="email"
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none" />
        </div>
        <div>
          <label htmlFor="cf-phone" className="block text-sm font-medium text-text-dark mb-1.5">
            Phone number <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel"
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-size" className="block text-sm font-medium text-text-dark mb-1.5">
            Company size <span aria-hidden="true">*</span>
          </label>
          <select id="cf-size" name="companySize" required defaultValue=""
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none bg-white">
            <option value="" disabled>Select company size</option>
            {companySizes.map((s) => <option key={s} value={s}>{s} employees</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-sector" className="block text-sm font-medium text-text-dark mb-1.5">
            Sector <span aria-hidden="true">*</span>
          </label>
          <select id="cf-sector" name="sector" required defaultValue=""
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none bg-white">
            <option value="" disabled>Select sector</option>
            {sectorOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-need" className="block text-sm font-medium text-text-dark mb-1.5">
            Primary need <span aria-hidden="true">*</span>
          </label>
          <select id="cf-need" name="primaryNeed" required defaultValue=""
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none bg-white">
            <option value="" disabled>Select primary need</option>
            {primaryNeeds.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-urgency" className="block text-sm font-medium text-text-dark mb-1.5">
            Urgency <span aria-hidden="true">*</span>
          </label>
          <select id="cf-urgency" name="urgency" required defaultValue=""
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none bg-white">
            <option value="" disabled>Select urgency</option>
            {urgencyOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="block text-sm font-medium text-text-dark mb-1.5">
          Message
        </label>
        <textarea id="cf-message" name="message" rows={4}
          className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm focus:border-primary-purple outline-none" />
      </div>

      {/* Honeypot field for basic spam protection — kept hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <input id="cf-consent" name="consent" type="checkbox" required
          className="mt-1 w-5 h-5 rounded border-light-lavender text-primary-purple focus:ring-2 focus:ring-primary-purple" />
        <label htmlFor="cf-consent" id="contact-form-privacy-note" className="text-sm text-text-secondary leading-relaxed">
          I consent to BlazeKonzult processing my information to respond to this enquiry, in line with the{" "}
          <a href="/privacy-policy" className="underline hover:text-primary-purple">Privacy Policy</a>. <span aria-hidden="true">*</span>
        </label>
      </div>

      <button type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-purple text-white font-semibold px-7 py-3.5 min-h-12 hover:bg-deep-purple transition-colors w-full sm:w-auto">
        <Send size={18} aria-hidden="true" />
        Send my request
      </button>
    </form>
  );
}
