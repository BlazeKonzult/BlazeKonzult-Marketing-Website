"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { submitForm } from "@/lib/submitForm";
import { useT } from "@/components/SiteData";

/** Newsletter signup. Submits to /contact.php, which emails the signup to BlazeKonzult. */
export default function NewsletterForm() {
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
    const result = await submitForm(form, "newsletter", { locale }, t);
    setSending(false);
    if (result.ok) setSubmitted(true);
    else setError(result.error);
  }

  if (submitted) {
    return (
      <p role="status" className="font-semibold text-white">
        {t.nlThanks}
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" aria-label={t.nlAria} noValidate>
        <label htmlFor="newsletter-email" className="sr-only">{t.nlEmail}</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.nlPlaceholder}
          className="field flex-1"
        />
        <div className="hidden" aria-hidden="true">
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="btn-submit"
        >
          <Send size={16} aria-hidden="true" />
          {sending ? t.fSending : t.nlSubscribe}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#ffb4b4]">{error}</p>
      )}
    </>
  );
}
