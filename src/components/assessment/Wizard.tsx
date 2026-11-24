"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, Lock, RotateCcw } from "lucide-react";
import { ApiFailure, call, checkAnswer, cleanAnswers, store, uuid, visibleCodes, type Answers, type ClientQuestion, type ClientTemplate } from "@/lib/assessment/api";
import { fmt, paths, SCALE, strings, type Locale } from "@/lib/assessment/i18n";

type Saved = { version_id: number; answers: Answers; step: number; idem: string; started: number; session_id?: string | null; saved_at: number };
type Phase = "loading" | "error" | "notfound" | "resume" | "ready" | "submitting";
const KEY = (slug: string) => `bk-assessment:${slug}`;
const MAX_AGE = 30 * 86400_000;

export default function Wizard({ locale }: { locale: Locale }) {
  const t = strings[locale];
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [tpl, setTpl] = useState<ClientTemplate | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const meta = useRef<{ idem: string; started: number; session_id: string | null }>({ idem: "", started: 0, session_id: null });
  const pending = useRef<Saved | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hp, setHp] = useState("");

  const load = useCallback(async (s: string) => {
    setPhase("loading");
    try {
      const data = await call<ClientTemplate>("GET", `/templates/${encodeURIComponent(s)}?locale=${locale}`);
      setTpl(data);
      const saved = store.get<Saved>(KEY(s));
      if (saved && Date.now() - saved.saved_at < MAX_AGE && Object.keys(saved.answers ?? {}).length) {
        pending.current = saved;
        setPhase("resume");
      } else {
        startFresh(s);
        setPhase("ready");
      }
    } catch (e) {
      setPhase(e instanceof ApiFailure && e.status === 404 ? "notfound" : "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function startFresh(s: string) {
    meta.current = { idem: uuid(), started: Date.now(), session_id: null };
    setAnswers({}); setStep(0); setErrors({});
    store.del(KEY(s));
    call<{ session_id: string }>("POST", "/sessions", { slug: s, locale }).then((r) => { meta.current.session_id = r.session_id; }).catch(() => {});
  }

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("t") ?? "general";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- slug comes from the URL on the client (static export)
    setSlug(s);
    load(s);
  }, [load]);

  // Steps: one per category that has at least one visible question
  const visible = useMemo(() => (tpl ? visibleCodes(tpl.questions, answers) : new Set<string>()), [tpl, answers]);
  const steps = useMemo(() => {
    if (!tpl) return [];
    return tpl.categories
      .map((c) => ({ ...c, questions: tpl.questions.filter((q) => q.category === c.key && visible.has(q.code)) }))
      .filter((c) => c.questions.length > 0);
  }, [tpl, visible]);
  const current = steps[Math.min(step, Math.max(0, steps.length - 1))];
  const isLast = step >= steps.length - 1;

  // Persist progress locally (answers never leave the device until submission)
  useEffect(() => {
    if (!slug || !tpl || phase !== "ready") return;
    store.set(KEY(slug), { version_id: tpl.version_id, answers, step, idem: meta.current.idem, started: meta.current.started, session_id: meta.current.session_id, saved_at: Date.now() } satisfies Saved);
  }, [answers, step, slug, tpl, phase]);

  // Anonymous funnel tracking (step numbers only)
  useEffect(() => {
    if (phase !== "ready" || !meta.current.session_id || !steps.length) return;
    call("POST", "/sessions/progress", { session_id: meta.current.session_id, step: step + 1, steps: steps.length }).catch(() => {});
  }, [step, steps.length, phase]);

  function resume(yes: boolean) {
    if (!slug || !tpl) return;
    const saved = pending.current;
    if (yes && saved) {
      let a = saved.answers ?? {};
      if (saved.version_id !== tpl.version_id) { a = keepValid(tpl.questions, a); setNotice(t.stale); }
      meta.current = { idem: saved.version_id === tpl.version_id ? saved.idem : uuid(), started: saved.started || Date.now(), session_id: saved.session_id ?? null };
      setAnswers(a);
      setStep(Math.max(0, saved.step ?? 0));
    } else startFresh(slug);
    setPhase("ready");
  }

  function setAnswer(code: string, v: unknown) {
    setAnswers((a) => ({ ...a, [code]: v }));
    setErrors((e) => { if (!e[code]) return e; const n = { ...e }; delete n[code]; return n; });
  }

  function validateStep(): boolean {
    if (!current) return true;
    const errs: Record<string, string> = {};
    for (const q of current.questions) { const e = checkAnswer(q, answers[q.code]); if (e) errs[q.code] = e; }
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => document.getElementById(`q-${Object.keys(errs)[0]}`)?.focus());
      return false;
    }
    return true;
  }

  function go(to: number) {
    setStep(to);
    setErrors({});
    requestAnimationFrame(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  async function submit() {
    if (!tpl || !slug || !validateStep()) return;
    setPhase("submitting"); setSubmitError(null);
    try {
      const r = await call<{ token: string }>("POST", "/submit", {
        slug, version_id: tpl.version_id, idempotency_key: meta.current.idem, answers: cleanAnswers(tpl.questions, answers),
        elapsed_ms: Date.now() - meta.current.started, locale, session_id: meta.current.session_id, website: hp,
      });
      store.del(KEY(slug));
      router.push(`${paths.results(locale)}#${r.token}`);
    } catch (e) {
      setPhase("ready");
      if (e instanceof ApiFailure && e.code === "stale_version") {
        const fresh = await call<ClientTemplate>("GET", `/templates/${encodeURIComponent(slug)}?locale=${locale}`).catch(() => null);
        if (fresh) { setTpl(fresh); setAnswers(keepValid(fresh.questions, answers)); meta.current.idem = uuid(); setNotice(t.stale); go(0); return; }
      }
      if (e instanceof ApiFailure && e.code === "validation" && e.details?.questions) {
        const errs = e.details.questions as Record<string, string>;
        setErrors(errs);
        const first = steps.findIndex((s) => s.questions.some((q) => errs[q.code]));
        if (first >= 0 && first !== step) setStep(first);
        setSubmitError(t.required_missing);
        return;
      }
      if (e instanceof ApiFailure && e.code === "too_fast") { setSubmitError(t.submit_error); meta.current.started -= 60_000; return; }
      setSubmitError(e instanceof ApiFailure && e.status === 429 ? t.too_many : t.submit_error);
    }
  }

  /* ------------------------------ Render ------------------------------ */
  if (phase === "loading") return <Status><Loader2 className="animate-spin text-brand" aria-hidden="true" /> {t.loading}</Status>;
  if (phase === "notfound") return <Status>{t.not_found} <a className="link" href={paths.hub(locale)}>{t.results_restart}</a></Status>;
  if (phase === "error" || !tpl) return <Status>{t.load_error} <button className="link" onClick={() => slug && load(slug)}>{t.retry}</button></Status>;

  if (phase === "resume") {
    return (
      <div className="mx-auto max-w-xl rounded-[var(--radius-md)] border border-line bg-white p-8 shadow-sm" role="dialog" aria-labelledby="resume-h" aria-describedby="resume-d">
        <h2 id="resume-h" className="t-h3">{t.resume_title}</h2>
        <p id="resume-d" className="mt-3 text-body">{t.resume_body} <strong className="text-heading">{tpl.name}</strong></p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="btn-submit sm:w-auto" onClick={() => resume(true)} autoFocus>{t.resume_yes}</button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-heading/20 px-5 font-semibold text-heading hover:border-heading/50" onClick={() => resume(false)}>
            <RotateCcw size={16} aria-hidden="true" /> {t.resume_no}
          </button>
        </div>
      </div>
    );
  }

  const pct = steps.length ? Math.round(((step + 1) / steps.length) * 100) : 0;
  const errCount = Object.keys(errors).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h2 className="t-h3">{tpl.name}</h2>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted">
          <span className="whitespace-nowrap">{fmt(t.step_of, step + 1, steps.length)}</span>
          <span className="inline-flex items-center gap-1.5"><Lock size={14} aria-hidden="true" /> {t.saved_locally}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist" role="progressbar" aria-label={t.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-4 hidden flex-wrap gap-x-4 gap-y-2 text-xs sm:flex" aria-label={t.progress}>
          {steps.map((s, i) => (
            <li key={s.key} className={`inline-flex items-center gap-1.5 ${i === step ? "font-semibold text-heading" : i < step ? "text-ok" : "text-muted"}`} aria-current={i === step ? "step" : undefined}>
              {i < step ? <Check size={13} aria-hidden="true" /> : <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-brand" : "bg-line"}`} />}
              {s.name}
            </li>
          ))}
        </ol>
      </div>

      {notice && <p className="mb-6 rounded-[var(--radius-sm)] border border-warn/30 bg-[#fff8ec] p-4 text-sm text-heading" role="status">{notice}</p>}

      {current && (
        <form noValidate onSubmit={(e) => { e.preventDefault(); if (isLast) submit(); else if (validateStep()) go(step + 1); }}>
          <h3 ref={headingRef} tabIndex={-1} className="t-h2 outline-none">{current.name}</h3>
          {current.description && <p className="t-lead mt-3 text-muted">{current.description}</p>}

          {errCount > 0 && <div className="form-error mt-6 flex items-start gap-2" role="alert"><AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {submitError ?? t.required_missing}</div>}

          <div className="mt-8 space-y-6">
            {current.questions.map((q) => <QuestionField key={q.code} q={q} value={answers[q.code]} error={errors[q.code]} locale={locale} onChange={(v) => setAnswer(q.code, v)} />)}
          </div>

          {/* Honeypot: hidden from people and assistive technology */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} name="website" /></label>
          </div>

          {submitError && errCount === 0 && <div className="form-error mt-6" role="alert">{submitError}</div>}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" disabled={step === 0} onClick={() => go(step - 1)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-heading/20 px-5 font-semibold text-heading hover:border-heading/50 disabled:invisible">
              <ArrowLeft size={18} aria-hidden="true" /> {t.back}
            </button>
            <button type="submit" className="btn-submit sm:w-auto" disabled={phase === "submitting"}>
              {phase === "submitting" ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {t.submitting}</> : isLast ? <>{t.see_results} <ArrowRight size={18} aria-hidden="true" /></> : <>{t.next} <ArrowRight size={18} aria-hidden="true" /></>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function keepValid(qs: ClientQuestion[], a: Answers): Answers {
  const out: Answers = {};
  for (const q of qs) {
    const v = a[q.code];
    if (v === undefined) continue;
    if ((v === "na" && q.allow_na) || (v === "unsure" && q.allow_unsure)) { out[q.code] = v; continue; }
    const vals = q.options.map((o) => String(o.value));
    if (q.type === "number" && Number.isFinite(Number(v))) out[q.code] = v;
    else if (q.type === "multi" && Array.isArray(v)) { const k = v.filter((x) => vals.includes(String(x))); if (k.length) out[q.code] = k; }
    else if (vals.includes(String(v))) out[q.code] = v;
  }
  return out;
}

function Status({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-xl items-center justify-center gap-3 py-24 text-center text-body" role="status" aria-live="polite">{children}</div>;
}

/* ---------------------------- Question renderer ---------------------------- */
function QuestionField({ q, value, error, locale, onChange }: { q: ClientQuestion; value: unknown; error?: string; locale: Locale; onChange: (v: unknown) => void }) {
  const t = strings[locale];
  const id = `q-${q.code}`;
  const errId = `${id}-err`;
  const descId = q.description ? `${id}-desc` : undefined;
  const errText = error === "out_of_range" ? fmt(t.out_of_range, q.min ?? "", q.max ?? "") : error === "required" ? t.required : error ? t.invalid : null;

  const opts: { value: string | number; label: string; sub?: string; idx?: number }[] =
    q.type === "maturity" ? SCALE[locale].map((l, i) => ({ value: i, label: l, idx: i })) : q.options.map((o) => ({ value: o.value, label: o.label }));
  const special = [...(q.allow_unsure ? [{ value: "unsure", label: t.unsure }] : []), ...(q.allow_na ? [{ value: "na", label: t.na }] : [])];

  return (
    <fieldset id={id} tabIndex={-1} aria-invalid={!!error} aria-describedby={[descId, error ? errId : null].filter(Boolean).join(" ") || undefined}
      className={`rounded-[var(--radius-md)] border bg-white p-5 outline-none transition-colors sm:p-6 ${error ? "border-risk" : "border-line"} focus-visible:ring-2 focus-visible:ring-brand/30`}>
      <legend className="sr-only">{q.title}</legend>
      <p aria-hidden="true" className="text-[1.0625rem] font-semibold leading-snug text-heading">
        {q.title} {!q.required && <span className="text-sm font-normal text-muted">({t.optional})</span>}
      </p>
      {q.description && <p id={descId} className="mt-1.5 text-sm text-muted">{q.description}</p>}
      {q.type === "multi" && <p className="mt-1.5 text-sm text-muted">{t.select_all}</p>}

      {q.type === "number" ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input type="number" inputMode="numeric" className="field max-w-[12rem]" aria-label={q.title} min={q.min ?? undefined} max={q.max ?? undefined}
            value={typeof value === "number" || (typeof value === "string" && value !== "na" && value !== "unsure") ? String(value) : ""} onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)} />
          {q.unit && <span className="text-sm text-muted">{q.unit}</span>}
        </div>
      ) : q.type === "multi" ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {opts.map((o) => {
            const arr = Array.isArray(value) ? value.map(String) : [];
            const on = arr.includes(String(o.value));
            return (
              <label key={String(o.value)} className={choiceCls(on)}>
                <input type="checkbox" className="check" checked={on} onChange={() => onChange(on ? arr.filter((x) => x !== String(o.value)) : [...arr, String(o.value)])} />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className={`mt-4 grid gap-2 ${q.type === "maturity" ? "" : "sm:grid-cols-2"}`}>
          {opts.map((o) => {
            const on = value !== undefined && value !== null && String(value) === String(o.value);
            return (
              <label key={String(o.value)} className={choiceCls(on)}>
                <input type="radio" className="check" name={id} checked={on} onChange={() => onChange(o.value)} />
                {o.idx !== undefined && <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${on ? "bg-brand text-white" : "bg-mist text-heading"}`}>{o.idx}</span>}
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {special.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-line pt-3">
          {special.map((o) => {
            const on = value === o.value;
            return (
              <label key={o.value} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${on ? "border-brand bg-brand-50 text-heading" : "border-line text-body hover:border-heading/40"}`}>
                <input type={q.type === "multi" || q.type === "number" ? "checkbox" : "radio"} name={q.type === "multi" || q.type === "number" ? undefined : id} className="check" checked={on}
                  onChange={() => onChange(on ? undefined : o.value)} />
                {o.label}
              </label>
            );
          })}
        </div>
      )}

      {errText && <p id={errId} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#9f1d1d]"><AlertCircle size={15} aria-hidden="true" /> {errText}</p>}
    </fieldset>
  );
}

const choiceCls = (on: boolean) =>
  `flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-2.5 text-[0.9375rem] transition-colors ${on ? "border-brand bg-brand-50 text-heading" : "border-line text-body hover:border-heading/40"}`;
