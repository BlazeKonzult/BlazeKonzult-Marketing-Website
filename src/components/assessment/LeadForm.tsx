"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { ApiFailure, call } from "@/lib/assessment/api";
import { fmt, pick, SERVICES, strings, type Locale } from "@/lib/assessment/i18n";

type Done = { reference: string; report: { url: string; expires_at: string } | null; consult: boolean };

export default function LeadForm({ token, locale, hasGaps, services }: { token: string; locale: Locale; hasGaps: boolean; services: string[] }) {
  const t = strings[locale];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const opened = useRef(0);
  useEffect(() => { opened.current = Date.now(); }, []);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const errs: Record<string, string> = {};
    const intents = { wants_report: f.get("wants_report") === "on", wants_consultation: f.get("wants_consultation") === "on", discuss_gaps: f.get("discuss_gaps") === "on" };
    if (!Object.values(intents).some(Boolean)) errs.intent = t.pick_one;
    if (!v("name")) errs.name = t.field_required;
    if (!v("company")) errs.company = t.field_required;
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v("email"))) errs.email = t.field_email;
    if (v("phone") && !/^[0-9 +().-]{6,40}$/.test(v("phone"))) errs.phone = t.field_phone;
    if (f.get("consent_privacy") !== "on") errs.consent_privacy = t.field_consent;
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[data-field="${Object.keys(errs)[0]}"]`)?.focus());
      return;
    }
    setSending(true); setFailure(null);
    try {
      const r = await call<{ reference: string; report: Done["report"] }>("POST", "/leads", {
        token, locale, ...intents, name: v("name"), company: v("company"), email: v("email"), phone: v("phone") || undefined, job_title: v("job_title") || undefined,
        contact_method: v("contact_method") || "email", timeframe: v("timeframe") || undefined, interests: f.getAll("interests").map(String), message: v("message") || undefined,
        consent_privacy: true, consent_marketing: f.get("consent_marketing") === "on", website: v("website"), elapsed_ms: Date.now() - opened.current,
      });
      setDone({ reference: r.reference, report: r.report, consult: intents.wants_consultation || intents.discuss_gaps });
    } catch (err) {
      if (err instanceof ApiFailure && err.code === "validation" && typeof err.details.field === "string") setErrors({ [err.details.field]: err.message });
      else if (err instanceof ApiFailure && err.code === "too_fast") { opened.current -= 10_000; setFailure(t.lead_error); }
      else setFailure(err instanceof ApiFailure && err.status === 429 ? t.too_many : t.lead_error);
    } finally { setSending(false); }
  }

  if (done) {
    return (
      <section className="rounded-[var(--radius-md)] border border-ok/30 bg-[#effaf5] p-6 sm:p-8" role="status" aria-live="polite">
        <h2 className="t-h3 flex items-center gap-2"><CheckCircle2 className="text-ok" aria-hidden="true" /> {t.lead_done_title}</h2>
        {done.report && (
          <>
            <p className="mt-3 text-body">{t.lead_done_report}</p>
            <a href={done.report.url} className="btn-submit mt-5 inline-flex w-auto" download><Download size={18} aria-hidden="true" /> {t.download}</a>
            <p className="mt-3 text-sm text-muted">{fmt(t.link_expires, new Date(done.report.expires_at.replace(" ", "T") + "Z").toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" }))}</p>
          </>
        )}
        {done.consult && <p className="mt-3 text-body">{t.lead_done_consult}</p>}
        <p className="mt-3 text-sm text-muted">{fmt(t.lead_done_ref, done.reference)}</p>
      </section>
    );
  }

  const err = (k: string) => errors[k] ? <p id={`lf-${k}-err`} className="mt-1.5 text-sm font-medium text-[#9f1d1d]">{errors[k]}</p> : null;
  const a11y = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `lf-${k}-err` : undefined, "data-field": k });
  const interestOpts = [...new Set([...services, "cybersecurity-health-check", "nis2-readiness", "virtual-ciso"])].filter((s) => SERVICES[s]).slice(0, 7);

  return (
    <section aria-labelledby="lead-h" className="on-dark surface-dark relative overflow-hidden rounded-[var(--radius-md)] p-6 sm:p-10">
      <h2 id="lead-h" className="t-h2 text-white">{t.lead_title}</h2>
      <p className="t-lead mt-3 max-w-2xl text-ink-300">{t.lead_lead}</p>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="mt-8 rounded-[var(--radius-md)] bg-white p-5 text-body sm:p-8">
        <fieldset data-field="intent" tabIndex={-1} aria-describedby={errors.intent ? "lf-intent-err" : undefined} className="outline-none">
          <legend className="field-label">{t.lead_want}</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {([["wants_report", t.want_report, true], ["wants_consultation", t.want_consult, false], ...(hasGaps ? [["discuss_gaps", t.want_discuss, false]] : [])] as [string, string, boolean][]).map(([n, l, d]) => (
              <label key={n} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-line px-4 py-3 text-[0.9375rem] hover:border-heading/40">
                <input type="checkbox" name={n} defaultChecked={d} className="check" /> <span>{l}</span>
              </label>
            ))}
          </div>
          {err("intent")}
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="lf-name">{t.name}</label><input id="lf-name" name="name" className="field" autoComplete="name" maxLength={120} required {...a11y("name")} />{err("name")}</div>
          <div><label className="field-label" htmlFor="lf-company">{t.company}</label><input id="lf-company" name="company" className="field" autoComplete="organization" maxLength={160} required {...a11y("company")} />{err("company")}</div>
          <div><label className="field-label" htmlFor="lf-email">{t.email}</label><input id="lf-email" name="email" type="email" className="field" autoComplete="email" maxLength={190} required {...a11y("email")} />{err("email")}</div>
          <div><label className="field-label" htmlFor="lf-phone">{t.phone} <span className="opt">({t.optional})</span></label><input id="lf-phone" name="phone" type="tel" className="field" autoComplete="tel" maxLength={40} {...a11y("phone")} />{err("phone")}</div>
          <div><label className="field-label" htmlFor="lf-job">{t.job} <span className="opt">({t.optional})</span></label><input id="lf-job" name="job_title" className="field" autoComplete="organization-title" maxLength={120} /></div>
          <div><label className="field-label" htmlFor="lf-tf">{t.timeframe_q} <span className="opt">({t.optional})</span></label>
            <select id="lf-tf" name="timeframe" className="field" defaultValue="">
              <option value="">–</option><option value="immediate">{t.tf_immediate}</option><option value="30_days">{t.tf_30}</option><option value="3_months">{t.tf_3m}</option><option value="exploring">{t.tf_exploring}</option>
            </select></div>
        </div>

        <fieldset className="mt-6">
          <legend className="field-label">{t.method}</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {[["email", t.method_email], ["phone", t.method_phone], ["either", t.method_either]].map(([v, l]) => (
              <label key={v} className="inline-flex min-h-10 items-center gap-2"><input type="radio" name="contact_method" value={v} defaultChecked={v === "email"} className="check" /> {l}</label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="field-label">{t.interests} <span className="opt">({t.optional})</span></legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {interestOpts.map((s) => <label key={s} className="inline-flex min-h-10 items-center gap-2"><input type="checkbox" name="interests" value={s} className="check" /> {pick(SERVICES[s], locale)}</label>)}
          </div>
        </fieldset>

        <div className="mt-6"><label className="field-label" htmlFor="lf-msg">{t.message} <span className="opt">({t.optional})</span></label><textarea id="lf-msg" name="message" rows={3} maxLength={2000} className="field" /></div>

        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

        <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consent_privacy" className="check" {...a11y("consent_privacy")} />
            <span>{t.consent_privacy} <a href="/privacy-policy/#assessment" className="font-semibold text-cobalt underline underline-offset-2 hover:text-brand" target="_blank" rel="noopener">{t.privacy_link}</a></span>
          </label>
          {err("consent_privacy")}
          <label className="flex items-start gap-3"><input type="checkbox" name="consent_marketing" className="check" /> <span>{t.consent_marketing}</span></label>
        </div>

        {failure && <p className="form-error mt-5" role="alert">{failure}</p>}
        <button type="submit" className="btn-submit mt-6 sm:w-auto" disabled={sending}>
          {sending ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {t.lead_sending}</> : t.lead_submit}
        </button>
      </form>
    </section>
  );
}
