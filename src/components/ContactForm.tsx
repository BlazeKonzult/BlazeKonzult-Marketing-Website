"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { submitForm } from "@/lib/submitForm";
import Link from "@/components/LocalLink";
import { useT } from "@/components/SiteData";

const companySizes = ["1–10", "11–50", "51–250", "250+"];

/**
 * Full contact / consultation-request form. Submits to the API (/api/forms), which validates the
 * input, applies spam protection, stores the lead and notifies the team.
 * Option values stay in English (stored data); labels follow the page language.
 */
export default function ContactForm() {
  const { t, locale } = useT();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setSending(true);
    setError(null);
    const result = await submitForm(form, "contact", { locale }, t);
    setSending(false);
    if (result.ok) setSubmitted(true);
    else setError(result.error);
  }

  if (submitted) {
    return (
      <div role="status" className="bg-mist border border-line rounded-[var(--radius-md)] p-8 text-center">
        <h3 className="t-h3 mb-2">{t.fThanksTitle}</h3>
        <p className="text-body">
          {t.fThanksText}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-describedby="contact-form-privacy-note">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-name" className="field-label">
            {t.fName} <span aria-hidden="true">*</span>
          </label>
          <input id="cf-name" name="name" type="text" required autoComplete="name"
            className="field" />
        </div>
        <div>
          <label htmlFor="cf-company" className="field-label">
            {t.fCompany} <span aria-hidden="true">*</span>
          </label>
          <input id="cf-company" name="company" type="text" required autoComplete="organization"
            className="field" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-email" className="field-label">
            {t.fEmail} <span aria-hidden="true">*</span>
          </label>
          <input id="cf-email" name="email" type="email" required autoComplete="email"
            className="field" />
        </div>
        <div>
          <label htmlFor="cf-phone" className="field-label">
            {t.fPhone} <span className="opt">({t.fOptional})</span>
          </label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel"
            className="field" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-size" className="field-label">
            {t.fSize} <span aria-hidden="true">*</span>
          </label>
          <select id="cf-size" name="companySize" required defaultValue=""
            className="field">
            <option value="" disabled>{t.fSizeSelect}</option>
            {companySizes.map((s) => <option key={s} value={s}>{s} {t.fEmployees}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-sector" className="field-label">
            {t.fSector} <span aria-hidden="true">*</span>
          </label>
          <select id="cf-sector" name="sector" required defaultValue=""
            className="field">
            <option value="" disabled>{t.fSectorSelect}</option>
            {t.sectors.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-need" className="field-label">
            {t.fNeed} <span aria-hidden="true">*</span>
          </label>
          <select id="cf-need" name="primaryNeed" required defaultValue=""
            className="field">
            <option value="" disabled>{t.fNeedSelect}</option>
            {t.needs.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cf-urgency" className="field-label">
            {t.fUrgency} <span aria-hidden="true">*</span>
          </label>
          <select id="cf-urgency" name="urgency" required defaultValue=""
            className="field">
            <option value="" disabled>{t.fUrgencySelect}</option>
            {t.urgencies.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="field-label">
          {t.fMessage}
        </label>
        <textarea id="cf-message" name="message" rows={4}
          className="field" />
      </div>

      {/* Honeypot field for basic spam protection — kept hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <input id="cf-consent" name="consent" type="checkbox" required
          className="check" />
        <label htmlFor="cf-consent" id="contact-form-privacy-note" className="text-sm text-body leading-relaxed">
          {t.fConsent}{" "}
          <Link href="/privacy-policy" className="link">{t.fPrivacy}</Link>. <span aria-hidden="true">*</span>
        </label>
      </div>

      {error && (
        <p role="alert" className="form-error">{error}</p>
      )}

      <button type="submit" disabled={sending}
        className="btn-submit w-full sm:w-auto">
        <Send size={18} aria-hidden="true" />
        {sending ? t.fSending : t.fSend}
      </button>
    </form>
  );
}
