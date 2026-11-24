"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, Loader2, Printer, ShieldAlert, Star } from "lucide-react";
import { ApiFailure, call, type ResultPayload } from "@/lib/assessment/api";
import { fmt, paths, pick, PRIORITY, SERVICES, strings, type Locale } from "@/lib/assessment/i18n";
import LeadForm from "./LeadForm";

const LEVEL_TONE: Record<string, string> = { initial: "#b42318", developing: "#a35d00", established: "#1649a8", advanced: "#0b7d5e", highly_mature: "#0b6b52" };
const PRIO_STYLE: Record<string, string> = {
  critical: "bg-[#fdecec] text-[#9f1d1d] border-[#f3c8c8]", high: "bg-[#fff4e5] text-[#7a4300] border-[#f5d9b0]",
  medium: "bg-[#eaf1fd] text-[#123b87] border-[#c9daf7]", low: "bg-mist text-heading border-line",
};
const PRIO_ICON: Record<string, string> = { critical: "!!!", high: "!!", medium: "!", low: "–" };

export default function Results({ locale }: { locale: Locale }) {
  const t = strings[locale];
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<ResultPayload | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "error" | "ready">("loading");

  useEffect(() => {
    const tok = window.location.hash.replace(/^#/, "");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- token lives in the URL fragment (never sent to servers or logs)
    setToken(tok);
    if (!/^[A-Za-z0-9_-]{43}$/.test(tok)) { setState("missing"); return; }
    call<ResultPayload>("GET", `/results/${tok}`)
      .then((d) => { setData(d); setState("ready"); })
      .catch((e) => setState(e instanceof ApiFailure && e.status === 404 ? "missing" : "error"));
  }, []);

  if (state === "loading") return <p className="flex items-center justify-center gap-3 py-24 text-body" role="status"><Loader2 className="animate-spin text-brand" aria-hidden="true" /> {t.results_loading}</p>;
  if (state !== "ready" || !data || !token) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center" role="alert">
        <p className="text-body">{state === "error" ? t.load_error : t.results_missing}</p>
        <a href={paths.hub(locale)} className="btn-submit mt-6 inline-flex w-auto">{t.results_restart}</a>
      </div>
    );
  }

  const r = data.result;
  const P = (v: Parameters<typeof pick>[0]) => pick(v, locale);
  const catName = new Map(r.categories.map((c) => [c.key, P(c.name)]));
  const tone = r.classification ? LEVEL_TONE[r.classification.key] ?? "#1649a8" : "#5d6b80";

  return (
    <div className="space-y-10">
      {/* Summary */}
      <section aria-labelledby="sum-h" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col items-center rounded-[var(--radius-md)] border border-line bg-white p-8 text-center">
          <h2 id="sum-h" className="t-eyebrow text-muted">{t.overall}</h2>
          <ScoreRing score={r.overall} color={tone} label={r.overall === null ? t.no_score : `${Math.round(r.overall)} ${t.out_of}`} />
          {r.classification ? (
            <p className="mt-2 text-lg font-semibold text-heading">{t.level}: <span style={{ color: tone }}>{P(r.classification.label)}</span></p>
          ) : <p className="mt-2 text-sm text-muted">{t.no_score_body}</p>}
          <LevelScale thresholds={data.thresholds} current={r.classification?.key} locale={locale} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label={t.coverage} value={`${Math.round(r.coverage)}%`} help={t.coverage_help} />
          <Stat label={t.uncertainty} value={`${Math.round(r.uncertainty)}%`} help={`${r.counts.unsure} / ${r.counts.applicable}`} />
          <Stat label={t.critical_gaps} value={String(r.gaps.length)} help={r.gaps.length ? t.critical_intro : t.no_gaps} tone={r.gaps.length ? "risk" : "ok"} />
          <Stat label={t.recommendations} value={String(r.recommendations.length)} help={t.recs_intro} />
          {r.uncertainty >= 30 && <p className="sm:col-span-2 flex gap-2 rounded-[var(--radius-sm)] border border-warn/30 bg-[#fff8ec] p-4 text-sm text-heading"><CircleHelp size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />{t.uncertainty_high}</p>}
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="cat-h" className="rounded-[var(--radius-md)] border border-line bg-white p-6 sm:p-8">
        <h2 id="cat-h" className="t-h3">{t.categories}</h2>
        <ul className="mt-6 space-y-5">
          {r.categories.map((c) => (
            <li key={c.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-semibold text-heading">{P(c.name)}</span>
                <span className="text-sm text-body">
                  {c.score === null ? t.no_score : <><strong className="text-heading">{Math.round(c.score)}</strong>/100 · {P(c.level?.label)}</>}
                  {c.unsure > 0 && <span className="text-muted"> · {c.unsure}× {t.unsure.toLowerCase()}</span>}
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${c.score ?? 0}%`, background: c.level ? LEVEL_TONE[c.level.key] ?? "#1649a8" : "transparent" }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Critical gaps + strengths */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="gap-h" className="rounded-[var(--radius-md)] border border-line bg-white p-6 sm:p-8">
          <h2 id="gap-h" className="t-h3 flex items-center gap-2"><ShieldAlert size={22} className="text-risk" aria-hidden="true" /> {t.critical_gaps}</h2>
          {r.gaps.length ? (
            <>
              <p className="mt-2 text-sm text-muted">{t.critical_intro}</p>
              <ul className="mt-5 space-y-3">
                {r.gaps.map((g) => (
                  <li key={g.code} className="flex gap-3 rounded-[var(--radius-sm)] border border-line p-4">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-risk" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-heading">{P(g.title)}</p>
                      <p className="mt-1 text-sm text-muted">{catName.get(g.category)} · {P(PRIORITY[g.risk])} · {g.answer === "unsure" ? t.answered_unsure : t.answered_low}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="mt-4 flex items-center gap-2 text-body"><CheckCircle2 size={18} className="text-ok" aria-hidden="true" /> {t.no_gaps}</p>}
        </section>
        <section aria-labelledby="str-h" className="rounded-[var(--radius-md)] border border-line bg-white p-6 sm:p-8">
          <h2 id="str-h" className="t-h3 flex items-center gap-2"><Star size={20} className="text-ok" aria-hidden="true" /> {t.strengths}</h2>
          {r.strengths.length ? (
            <ul className="mt-5 space-y-2">{r.strengths.map((k) => <li key={k} className="flex items-center gap-2 text-body"><CheckCircle2 size={18} className="text-ok" aria-hidden="true" /> {catName.get(k)}</li>)}</ul>
          ) : <p className="mt-4 text-sm text-body">{t.no_strengths}</p>}
        </section>
      </div>

      {/* Recommendations */}
      <section aria-labelledby="rec-h">
        <h2 id="rec-h" className="t-h2">{t.recommendations}</h2>
        <p className="mt-2 text-muted">{t.recs_intro}</p>
        {r.recommendations.length ? (
          <ol className="mt-6 space-y-4">
            {r.recommendations.map((rec, i) => (
              <li key={rec.code} className="rounded-[var(--radius-md)] border border-line bg-white p-6 break-inside-avoid">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="text-muted">{i + 1}.</span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${PRIO_STYLE[rec.priority] ?? PRIO_STYLE.low}`}>
                    <span aria-hidden="true">{PRIO_ICON[rec.priority]}</span> {t.priority}: {P(PRIORITY[rec.priority])}
                  </span>
                  {rec.timeframe && <span className="rounded-full border border-line px-2.5 py-1 text-body">{t.timeframe}: {P(rec.timeframe)}</span>}
                  <span className="rounded-full bg-mist px-2.5 py-1 text-body">{catName.get(rec.category)}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-heading">{P(rec.title)}</h3>
                <p className="mt-2 text-body">{P(rec.description)}</p>
                {(rec.impact || rec.remediation) && (
                  <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    {rec.impact && <div><dt className="font-semibold text-heading">{t.why}</dt><dd className="mt-1 text-body">{P(rec.impact)}</dd></div>}
                    {rec.remediation && <div><dt className="font-semibold text-heading">{t.how}</dt><dd className="mt-1 text-body">{P(rec.remediation)}</dd></div>}
                  </dl>
                )}
                {rec.service && SERVICES[rec.service] && (
                  <a href={`/${rec.service}/`} className="arrow-link link mt-4 text-sm print:hidden">{t.service_link}: {P(SERVICES[rec.service])} <ArrowRight size={15} aria-hidden="true" /></a>
                )}
              </li>
            ))}
          </ol>
        ) : <p className="mt-6 rounded-[var(--radius-md)] border border-line bg-white p-6 text-body">{t.no_recs}</p>}
      </section>

      {r.services.length > 0 && (
        <section aria-labelledby="svc-h" className="print:hidden">
          <h2 id="svc-h" className="t-h3">{t.services_title}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {r.services.map((s) => SERVICES[s] && <li key={s}><a href={`/${s}/`} className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-heading hover:border-brand hover:text-brand">{P(SERVICES[s])}</a></li>)}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-heading/20 bg-white px-5 font-semibold text-heading hover:border-heading/50">
          <Printer size={18} aria-hidden="true" /> {t.print}
        </button>
        <a href={paths.hub(locale)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-5 font-semibold text-cobalt hover:text-brand">{t.retake}</a>
      </div>

      <div className="print:hidden"><LeadForm token={token} locale={locale} hasGaps={r.gaps.length > 0} services={r.services} /></div>

      <footer className="space-y-2 border-t border-line pt-6 text-sm text-muted">
        <p>{t.disclaimer}</p>
        <p className="print:hidden">{t.share_note}</p>
        <p>{fmt(t.version, data.template.version, data.ref)} · {new Date(data.created_at.replace(" ", "T") + "Z").toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
      </footer>
    </div>
  );
}

function ScoreRing({ score, color, label }: { score: number | null; color: string; label: string }) {
  const R = 54, C = 2 * Math.PI * R, v = score ?? 0;
  return (
    <div className="relative my-4 h-44 w-44">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" role="img" aria-label={label}>
        <circle cx="64" cy="64" r={R} fill="none" stroke="#eef2f8" strokeWidth="12" />
        <circle cx="64" cy="64" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(C * v) / 100} ${C}`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <div><span className="block font-[family-name:var(--font-display)] text-5xl font-bold text-heading">{score === null ? "–" : Math.round(score)}</span>
          <span className="text-xs text-muted">/ 100</span></div>
      </div>
    </div>
  );
}

function LevelScale({ thresholds, current, locale }: { thresholds: ResultPayload["thresholds"]; current?: string; locale: Locale }) {
  const sorted = [...thresholds].sort((a, b) => a.min - b.min);
  return (
    <ol className="mt-5 flex w-full flex-wrap justify-center gap-1.5 text-xs">
      {sorted.map((th, i) => {
        const on = th.key === current;
        const max = i < sorted.length - 1 ? sorted[i + 1].min - 1 : 100;
        return (
          <li key={th.key} aria-current={on ? "true" : undefined}
            className={`rounded-full border px-2.5 py-1 ${on ? "border-heading bg-heading font-semibold text-white" : "border-line text-muted"}`}>
            {pick(th.label, locale)} <span>{th.min}–{max}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Stat({ label, value, help, tone }: { label: string; value: string; help?: string; tone?: "ok" | "risk" }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-white p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-bold ${tone === "risk" ? "text-risk" : tone === "ok" ? "text-ok" : "text-heading"}`}>{value}</p>
      {help && <p className="mt-1 text-sm text-body">{help}</p>}
    </div>
  );
}
