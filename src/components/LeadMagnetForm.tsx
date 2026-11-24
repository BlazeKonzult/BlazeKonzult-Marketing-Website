"use client";

import { useState, type FormEvent } from "react";
import { Download } from "lucide-react";
import { submitForm } from "@/lib/submitForm";
import Link from "@/components/LocalLink";
import { useT } from "@/components/SiteData";

type LeadMagnetFormProps = {
  resourceName: string;
  buttonLabel?: string;
  compact?: boolean;
};

/**
 * Lead-magnet request form. Submits to /contact.php, which emails the request
 * to BlazeKonzult so the checklist can be sent to the visitor.
 */
export default function LeadMagnetForm({ resourceName, buttonLabel = "Request the Free Checklist", compact = false }: LeadMagnetFormProps) {
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
    const result = await submitForm(form, "checklist", { resource: resourceName, locale }, t);
    setSending(false);
    if (result.ok) setSubmitted(true);
    else setError(result.error);
  }

  if (submitted) {
    return (
      <div role="status" className="bg-white border border-line rounded-[var(--radius-md)] p-6 text-center">
        <p className="font-semibold text-heading">{t.lmThanks}</p>
        <p className="text-sm text-body mt-1">
          {t.lmThanksText(resourceName)}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-white border border-line rounded-[var(--radius-md)] shadow-[var(--shadow-raised)] p-6 ${compact ? "" : "sm:p-8"}`} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`name-${resourceName}`} className="field-label">
            {t.fName}
          </label>
          <input
            id={`name-${resourceName}`}
            name="name"
            type="text"
            required
            autoComplete="name"
            className="field"
          />
        </div>
        <div>
          <label htmlFor={`company-${resourceName}`} className="field-label">
            {t.fCompany}
          </label>
          <input
            id={`company-${resourceName}`}
            name="company"
            type="text"
            required
            autoComplete="organization"
            className="field"
          />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={`email-${resourceName}`} className="field-label">
          {t.fEmail}
        </label>
        <input
          id={`email-${resourceName}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </div>
      {/* Honeypot field for basic spam protection — kept hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="mt-4 flex items-start gap-3">
        <input
          id={`consent-${resourceName}`}
          name="consent"
          type="checkbox"
          required
          className="check"
        />
        <label htmlFor={`consent-${resourceName}`} className="text-xs text-muted leading-relaxed">
          {t.lmConsent}{" "}
          <Link href="/privacy-policy" className="link">{t.fPrivacy}</Link>. {t.lmUnsub}
        </label>
      </div>
      {error && (
        <p role="alert" className="form-error mt-4">{error}</p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="btn-submit mt-5 w-full"
      >
        <Download size={18} aria-hidden="true" />
        {sending ? t.fSending : buttonLabel}
      </button>
    </form>
  );
}
