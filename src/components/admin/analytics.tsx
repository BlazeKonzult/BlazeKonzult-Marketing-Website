/* eslint-disable @typescript-eslint/no-explicit-any -- analytics renders loosely-typed API JSON */
"use client";

import { useState } from "react";
import { BarChart3, Download, Globe, RefreshCw } from "lucide-react";
import { api, fmtNum, fmtPct, STATUS_LABEL, STATUS_ORDER, timeAgo } from "./lib";
import { Btn, Card, EmptyState, ErrorBox, Loading, Notice, Page, Tabs, useLoad } from "./ui";
import { BarList, LineChart, MetricCard, ScoreRing, downloadCsv } from "./charts";
import { PeriodPicker } from "./dashboard";
import { ClipboardCheck, PlayCircle, Target, TrendingUp, Users, UserCheck, PhoneCall } from "lucide-react";

type View = "assessments" | "leads" | "maturity" | "industries" | "content" | "website";

export function BusinessAnalytics() {
  const [pv, setPv] = useState<{ period: string; from?: string; to?: string }>({ period: "90d" });
  const [view, setView] = useState<View>("assessments");
  const qs = `period=${pv.period}${pv.period === "custom" ? `&from=${pv.from}&to=${pv.to}` : ""}`;
  const dash = useLoad(() => api("GET", `/dashboard?${qs}`), [qs]);
  const range = dash.data ? `from=${dash.data.period.from}&to=${dash.data.period.to}` : "";
  const an = useLoad(() => (range ? api("GET", `/analytics?${range}`) : Promise.resolve(null)), [range]);
  const d = dash.data; const a = an.data;
  return (
    <Page title="Business analytics" lead="Customer acquisition, assessment performance and maturity trends, calculated from this application's own records. No third-party tracking is used."
      actions={<><PeriodPicker value={pv} onChange={setPv} /><Btn onClick={() => { dash.reload(); an.reload(); }} label="Refresh"><RefreshCw size={15} /></Btn></>}>
      <Tabs label="Analytics view" value={view} onChange={setView} tabs={[{ key: "assessments", label: "Assessment performance" }, { key: "leads", label: "Lead conversion" }, { key: "maturity", label: "Cybersecurity maturity" }, { key: "industries", label: "Industries" }, { key: "content", label: "Content" }, { key: "website", label: "Website traffic" }]} />
      {dash.error ? <ErrorBox onRetry={dash.reload}>{dash.error}</ErrorBox> : !d ? <Loading /> : (
        <>
          {view === "assessments" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={PlayCircle} label="Started" value={fmtNum(d.kpis.current.starts)} delta={{ kind: "count", cur: d.kpis.current.starts, prev: d.kpis.previous.starts, hasHistory: d.has_history }} />
                <MetricCard icon={ClipboardCheck} label="Completed" value={fmtNum(d.kpis.current.completed)} delta={{ kind: "count", cur: d.kpis.current.completed, prev: d.kpis.previous.completed, hasHistory: d.has_history }} />
                <MetricCard icon={Target} label="Completion rate" value={fmtPct(d.kpis.current.completion_rate)} delta={{ kind: "rate", cur: d.kpis.current.completion_rate, prev: d.kpis.previous.completion_rate, hasHistory: d.has_history }} />
                <MetricCard icon={Users} label="Leads from assessments" value={fmtNum(a?.leads)} sub={a ? `${fmtPct(a.lead_rate)} of completions` : undefined} />
              </div>
              <Card title="Starts, completions and leads" lead={`Per ${d.period.bucket}`}><LineChart title="Assessment performance" keys={d.series.keys} bucket={d.period.bucket} series={[{ key: "s", label: "Starts", values: d.series.starts }, { key: "c", label: "Completed", values: d.series.completed }, { key: "l", label: "Leads", values: d.series.leads }]} /></Card>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Completions by assessment type">{!a ? <Loading rows={2} /> : <BarList rows={a.by_type.map((x: any) => ({ key: x.slug, label: x.slug, value: x.n, text: `${x.n} · average ${x.avg ?? "–"}` }))} empty="No completed assessments in this period." />}</Card>
                <Card title="Where people stop" lead="Unfinished sessions by the last step reached">{!a ? <Loading rows={2} /> : !a.step_tracking ? <p className="text-sm text-muted">Step tracking is switched off in Website settings.</p> : <BarList color="var(--a-chart-2)" rows={a.abandonment.map((x: any) => ({ key: String(x.step), label: `Step ${x.step}`, value: x.n }))} empty="No abandoned sessions in this period." />}</Card>
              </div>
            </div>
          )}
          {view === "leads" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users} label="New leads" value={fmtNum(d.kpis.current.leads)} delta={{ kind: "count", cur: d.kpis.current.leads, prev: d.kpis.previous.leads, hasHistory: d.has_history }} />
                <MetricCard icon={UserCheck} label="Qualified" value={fmtNum(d.kpis.current.qualified)} delta={{ kind: "count", cur: d.kpis.current.qualified, prev: d.kpis.previous.qualified, hasHistory: d.has_history }} />
                <MetricCard icon={PhoneCall} label="Consultation requests" value={fmtNum(d.kpis.current.consultations)} delta={{ kind: "count", cur: d.kpis.current.consultations, prev: d.kpis.previous.consultations, hasHistory: d.has_history }} />
                <MetricCard icon={TrendingUp} label="Conversion rate" value={fmtPct(d.kpis.current.conversion_rate)} delta={{ kind: "rate", cur: d.kpis.current.conversion_rate, prev: d.kpis.previous.conversion_rate, hasHistory: d.has_history }} />
              </div>
              <Card title="Lead acquisition" lead={`Per ${d.period.bucket}`}><LineChart title="Lead acquisition" keys={d.series.keys} bucket={d.period.bucket} series={[{ key: "l", label: "All leads", values: d.series.leads }, { key: "c", label: "Consultations", values: d.series.consultations }, { key: "e", label: "Contact enquiries", values: d.series.enquiries }, { key: "q", label: "Qualified", values: d.series.qualified }]} /></Card>
              <Card title="Current pipeline (all time)" actions={<Btn small href="#/pipeline">Open pipeline</Btn>}>
                <BarList rows={STATUS_ORDER.map((s) => ({ key: s, label: STATUS_LABEL[s], value: d.pipeline.find((x: any) => x.status === s)?.n ?? 0, href: `#/leads?status=${s}` }))} />
              </Card>
            </div>
          )}
          {view === "maturity" && (!a ? <Loading /> : !a.completed ? <Card><EmptyState icon={BarChart3} title="No completed assessments in this period">Maturity trends appear when businesses complete assessments.</EmptyState></Card> : (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <Card title="Average maturity"><div className="flex items-center gap-4"><ScoreRing value={a.avg_score} label="Average maturity score" size={104} /><div className="text-sm"><p className="text-heading">Sample size <span className="tnum font-semibold">{a.completed}</span></p>{a.completed < 5 && <p className="mt-1 text-xs text-warn-fg">Small sample; averages may not be representative.</p>}</div></div></Card>
                <Card title="Maturity levels"><BarList rows={a.by_classification.map((x: any) => ({ key: x.key, label: x.key.replace(/_/g, " "), value: x.n }))} /></Card>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Average score by category" lead="Weakest first"><BarList max={100} rows={d.maturity.categories.map((x: any) => ({ key: x.key, label: x.name, value: x.avg ?? 0, text: `${x.avg} · n=${x.n}` }))} /></Card>
                <Card title="Most common critical gaps"><BarList color="var(--a-chart-2)" rows={d.maturity.gaps.map((g: any) => ({ key: g.code, label: g.title, value: g.n, text: `${g.n} · ${fmtPct(g.pct)}` }))} empty="No critical gaps in this period." /></Card>
                <Card title="Monthly trend" lead="Completions and average score"><BarList rows={a.trend.map((x: any) => ({ key: x.month, label: x.month, value: x.n, text: `${x.n} · average ${x.avg ?? "–"}` }))} /></Card>
                <Card title="Recommended services"><BarList color="var(--a-chart-3)" rows={d.maturity.services.map((x: any) => ({ key: x.key, label: x.name, value: x.n }))} empty="No recommendations in this period." /></Card>
              </div>
              <p className="text-xs text-muted">Maturity scores describe self-reported practices. They are not estimates of breach probability and do not indicate compliance.</p>
            </div>
          ))}
          {view === "industries" && (!a ? <Loading /> : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Assessments by industry" actions={<Btn small onClick={() => downloadCsv("industries.csv", [["industry", "assessments"], ...a.by_industry.map((x: any) => [x.key, x.n])])}><Download size={13} /> CSV</Btn>}><BarList rows={a.by_industry.map((x: any) => ({ key: x.key, label: x.key.replace(/_/g, " "), value: x.n }))} empty="No assessments in this period." /></Card>
              <Card title="Assessments by company size"><BarList color="var(--a-chart-4)" rows={a.by_size.map((x: any) => ({ key: x.key, label: x.key === "unknown" ? "Not given" : `${x.key} employees`, value: x.n }))} empty="No assessments in this period." /></Card>
            </div>
          ))}
          {view === "content" && (
            <Card title="Recent content changes" lead="Page views per article are not tracked (no analytics script is installed), so content performance is shown as editorial activity.">
              {d.website.recent.length ? <ul className="divide-y divide-line text-sm">{d.website.recent.map((r: any, i: number) => <li key={i} className="flex justify-between gap-3 py-2"><span className="text-heading">{r.doc_key} <span className="text-muted">· {r.action}</span></span><span className="text-xs text-muted">{r.user_name ?? "System"} · {timeAgo(r.created_at)}</span></li>)}</ul> : <p className="text-sm text-muted">No content changes yet.</p>}
            </Card>
          )}
          {view === "website" && (
            <Card><EmptyState icon={Globe} title="Website traffic analytics are not configured">The website deliberately loads no tracking scripts, so it needs no cookie banner. To see visitors and page views, connect a privacy-friendly analytics tool or use your hosting statistics (cPanel → Metrics). No traffic figures are estimated here.</EmptyState></Card>
          )}
        </>
      )}
      {view !== "website" && <div className="mt-6"><Notice tone="info">Figures are calculated from records in this application for {d?.period.label.toLowerCase() ?? "the selected period"}. Deleted records (data retention, erasure requests) are no longer counted.</Notice></div>}
    </Page>
  );
}
