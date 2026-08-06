"use client";

import { useState, type FormEvent } from "react";
import { Download } from "lucide-react";

type LeadMagnetFormProps = {
  resourceName: string;
  buttonLabel?: string;
  compact?: boolean;
};

/**
 * Lead-magnet request form.
 * PLACEHOLDER: wire this up to a secure server-side endpoint (e.g. a Next.js
 * Route Handler or a form backend such as Formspree/HubSpot) that performs
 * server-side validation, rate limiting and spam protection before sending
 * the checklist PDF. Do not submit sensitive data via client-side code only.
 */
export default function LeadMagnetForm({ resourceName, buttonLabel = "Download the Free Checklist", compact = false }: LeadMagnetFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // PLACEHOLDER: replace with real submission handler / API call.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div role="status" className="bg-white/95 rounded-2xl p-6 text-center">
        <p className="font-semibold text-deep-purple">Thank you — check your inbox shortly.</p>
        <p className="text-sm text-text-secondary mt-1">
          {/* PLACEHOLDER: confirm the checklist PDF file is attached/linked in the automated email */}
          We&apos;ll send the {resourceName} to the email address you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-white/95 rounded-2xl p-6 ${compact ? "" : "sm:p-8"}`} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`name-${resourceName}`} className="block text-sm font-medium text-text-dark mb-1.5">
            Name
          </label>
          <input
            id={`name-${resourceName}`}
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none"
          />
        </div>
        <div>
          <label htmlFor={`company-${resourceName}`} className="block text-sm font-medium text-text-dark mb-1.5">
            Company
          </label>
          <input
            id={`company-${resourceName}`}
            name="company"
            type="text"
            required
            autoComplete="organization"
            className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none"
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`email-${resourceName}`} className="block text-sm font-medium text-text-dark mb-1.5">
          Business email
        </label>
        <input
          id={`email-${resourceName}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-light-lavender px-4 py-2.5 text-sm min-h-11 focus:border-primary-purple outline-none"
        />
      </div>
      <div className="mt-4 flex items-start gap-3">
        <input
          id={`consent-${resourceName}`}
          name="consent"
          type="checkbox"
          required
          className="mt-1 w-5 h-5 rounded border-light-lavender text-primary-purple focus:ring-2 focus:ring-primary-purple"
        />
        <label htmlFor={`consent-${resourceName}`} className="text-xs text-text-secondary leading-relaxed">
          I agree to receive this resource and occasional cybersecurity guidance from BlazeKonzult by email. See our{" "}
          <a href="/privacy-policy" className="underline hover:text-primary-purple">
            Privacy Policy
          </a>
          . You can unsubscribe at any time.
        </label>
      </div>
      <button
        type="submit"
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary-purple text-white font-semibold px-6 py-3 min-h-12 hover:bg-deep-purple transition-colors"
      >
        <Download size={18} aria-hidden="true" />
        {buttonLabel}
      </button>
    </form>
  );
}
