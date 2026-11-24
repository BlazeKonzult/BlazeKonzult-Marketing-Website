/* eslint-disable @typescript-eslint/no-explicit-any -- dashboard renders loosely-typed API JSON */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, CalendarRange, CheckCircle2, ClipboardCheck, Download, ExternalLink, FileText, Gauge, Home, ImagePlus, ListPlus, MessageSquare,
  Newspaper, PhoneCall, PlayCircle, RefreshCw, Sparkles, Target, TrendingUp, UserCheck, Users, Activity as ActivityIcon, type LucideIcon,
} from "lucide-react";
import { api, can, fmtNum, fmtPct, timeAgo, STATUS_LABEL, STATUS_ORDER } from "./lib";
import { useAdmin } from "./ctx";
import { Btn, Card, EmptyState, ErrorBox, Field, inputCls, Modal, Skeleton, Badge, type Tone } from "./ui";
import { BarList, LineChart, MetricCard, ScoreRing, downloadCsv } from "./charts";
import { useSiteContent, seoIssues } from "./sitecontent";

export const PERIODS: [string, string][] = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["90d", "Last 90 days"], ["month", "This month"], ["quarter", "This quarter"], ["year", "This year"], ["custom", "Custom range…"]];
const PERIOD_KEY = "bk-admin-period";

/** Reporting-period selector (presets + custom range). */
export function PeriodPicker({ value, onChange }: { value: { period: string; from?: string; to?: string }; onChange: (v: { period: string; from?: string; to?: string }) => void }) {
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState(value.from ?? ""); const [to, setTo] = useState(value.to ?? "");
  return (
    <>
      <label className="relative inline-flex items-center">
        <span className="sr-only">Reporting period</span>
        <CalendarRange size={16} className="pointer-events-none absolute left-3 text-muted" aria-hidden="true" />
        <select className={`${inputCls} w-auto pl-9 pr-8 font-medium`} value={value.period} onChange={(e) => { if (e.target.value === "custom") { setCustom(true); return; } onChange({ period: e.target.value }); }}>
          {PERIODS.map(([k, l]) => <option key={k} value={k}>{k === "custom" && value.period === "custom" ? `${value.from} – ${value.to}` : l}</option>)}
        </select>
      </label>
      <Modal open={custom} onClose={() => setCustom(false)} title="Custom date range" size="sm" description="Dates are in UTC. Ranges can be up to three years."
        footer={<><Btn onClick={() => setCustom(false)}>Cancel</Btn><Btn kind="primary" disabled={!from || !to || to < from} onClick={() => { onChange({ period: "custom", from, to }); setCustom(false); }}>Apply</Btn></>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><input data-autofocus type="date" className={inputCls} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To" error={from && to && to < from ? "Must be on or after the start date" : null}><input type="date" className={inputCls} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
      </Modal>
    </>
  );
}

function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }

export function Dashboard() {
  const { user, notify } = useAdmin();
  const [pv, setPv] = useState<{ period: string; from?: string; to?: string }>({ period: "30d" });
  // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the last chosen period
  useEffect(() => { try { const p = localStorage.getItem(PERIOD_KEY); if (p) setPv({ period: p }); } catch { /* ignore */ } }, []);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const qs = `period=${pv.period}${pv.period === "custom" ? `&from=${pv.from}&to=${pv.to}` : ""}`;
  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state for a new period
    setBusy(true);
    api("GET", `/dashboard?${qs}`).then((d) => { if (live) { setData(d); setErr(null); } }).catch((e) => { if (live) setErr(e.message); }).finally(() => { if (live) setBusy(false); });
    return () => { live = false; };
  }, [qs, tick]);
  const setPeriod = (v: typeof pv) => { setPv(v); if (v.period !== "custom") { try { localStorage.setItem(PERIOD_KEY, v.period); } catch { /* ignore */ } } };
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const exportOverview = () => {
    if (!data) return;
    const k = data.kpis;
    const rows: (string | number | null)[][] = [["BlazeKonzult overview", data.period.label, `${data.period.from} to ${data.period.to}`], [], ["Metric", "This period", "Previous period"]];
    for (const [key, label] of KPI_LABELS) rows.push([label, k.current[key], k.previous[key]]);
    rows.push([], ["Period", "Assessment starts", "Completed", "Leads", "Consultation requests"]);
    data.series.keys.forEach((key: string, i: number) => rows.push([key, data.series.starts[i], data.series.completed[i], data.series.leads[i], data.series.consultations[i]]));
    downloadCsv(`overview-${data.period.from}-${data.period.to}.csv`, rows);
    notify("Overview exported.");
  };

  return (
    <div className="a-fade">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium text-muted">{today}</p>
          <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-[-0.015em] text-heading">{greeting()}, {user.name.split(" ")[0]}</h1>
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted">How assessments, leads and the website are performing{data ? <> · <span className="text-body">{data.period.label}</span></> : null}. Figures come from live records only.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2" data-noprint>
          <PeriodPicker value={pv} onChange={setPeriod} />
          <Btn onClick={() => setTick((t) => t + 1)} busy={busy} label="Refresh data" title="Refresh data">{!busy && <RefreshCw size={15} />}<span className="hidden sm:inline">Refresh</span></Btn>
          <Btn onClick={exportOverview} disabled={!data}><Download size={15} /><span className="hidden sm:inline">Export</span></Btn>
        </div>
      </div>
      {err && <ErrorBox onRetry={() => setTick((t) => t + 1)}>{err}</ErrorBox>}
      {!data && !err ? <DashSkeleton /> : data && <DashBody d={data} />}
    </div>
  );
}

const KPI_LABELS: [string, string][] = [["starts", "Assessments started"], ["completed", "Assessments completed"], ["completion_rate", "Completion rate"], ["leads", "New leads"], ["qualified", "Qualified leads"], ["consultations", "Consultation requests"], ["conversion_rate", "Lead conversion rate"], ["enquiries", "Website enquiries"]];

function DashSkeleton() {
  return <div className="space-y-6" role="status" aria-label="Loading dashboard"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[9.5rem] rounded-xl" />)}</div><div className="grid gap-6 xl:grid-cols-3"><Skeleton className="h-80 rounded-xl xl:col-span-2" /><Skeleton className="h-80 rounded-xl" /></div></div>;
}

function DashBody({ d }: { d: any }) {
  const { user } = useAdmin();
  const c = d.kpis.current, p = d.kpis.previous, h = d.has_history, s = d.series;
  const leads = can(user, "leads"); const assess = can(user, "assessments");
  const kpis: { key: string; icon: LucideIcon; label: string; value: string; kind: "count" | "rate"; spark?: number[]; help: string; href?: string; sub?: string }[] = [
    { key: "starts", icon: PlayCircle, label: "Assessments started", value: fmtNum(c.starts), kind: "count", spark: s.starts, help: "Assessment sessions that began in this period (step 1 opened).", href: "#/assessment-analytics" },
    { key: "completed", icon: ClipboardCheck, label: "Assessments completed", value: fmtNum(c.completed), kind: "count", spark: s.completed, help: "Assessments submitted with a result in this period.", href: assess ? "#/assessments" : undefined },
    { key: "completion_rate", icon: Target, label: "Completion rate", value: fmtPct(c.completion_rate), kind: "rate", help: "Of the sessions started in this period, the share that were completed. Shows “–” when nothing was started.", sub: c.starts ? `${c.starts} started` : undefined },
    { key: "leads", icon: Users, label: "New leads", value: fmtNum(c.leads), kind: "count", spark: s.leads, help: "Leads from every source: assessments, contact form, checklists and newsletter.", href: leads ? "#/leads" : undefined },
    { key: "qualified", icon: UserCheck, label: "Qualified leads", value: fmtNum(c.qualified), kind: "count", spark: s.qualified, help: "Leads created in this period that are now qualified, scheduled, proposed or converted.", href: leads ? "#/leads?status=qualified" : undefined },
    { key: "consultations", icon: PhoneCall, label: "Consultation requests", value: fmtNum(c.consultations), kind: "count", spark: s.consultations, help: "Leads that asked for a consultation.", href: leads ? "#/consultations" : undefined },
    { key: "conversion_rate", icon: TrendingUp, label: "Lead conversion rate", value: fmtPct(c.conversion_rate), kind: "rate", help: "Share of this period's leads that are now marked converted. Shows “–” when there were no leads.", sub: c.leads ? `${c.leads} leads` : undefined },
    { key: "enquiries", icon: MessageSquare, label: "Website enquiries", value: fmtNum(c.enquiries), kind: "count", spark: s.enquiries, help: "Messages sent through the contact form.", href: leads ? "#/enquiries" : undefined },
  ];
  const pipeTotal = d.pipeline.reduce((a: number, x: any) => a + x.n, 0);
  return (
    <div className="space-y-6">
      <section aria-labelledby="kpi-h">
        <h2 id="kpi-h" className="sr-only">Key figures</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => <MetricCard key={k.key} icon={k.icon} label={k.label} value={k.value} help={k.help} href={k.href} sub={k.sub} spark={k.spark} delta={{ kind: k.kind, cur: c[k.key], prev: p[k.key], hasHistory: h }} />)}
        </div>
        {!h && <p className="mt-3 text-xs text-muted">Comparisons appear once there are records from before this period.</p>}
      </section>

      <QuickActions />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Assessment performance" lead={`Per ${d.period.bucket} · ${d.period.label}`}>
          <LineChart title="Assessment performance" keys={s.keys} bucket={d.period.bucket} series={[{ key: "starts", label: "Starts", values: s.starts }, { key: "completed", label: "Completed", values: s.completed }, { key: "leads", label: "Leads", values: s.leads }, { key: "consultations", label: "Consultations", values: s.consultations }]} />
        </Card>
        <Card title="Lead pipeline" lead={`${pipeTotal} leads in total, all time`} actions={leads && <a href="#/pipeline" className="text-[0.8125rem] font-medium text-cobalt hover:underline">Open board</a>}>
          {pipeTotal === 0 ? <EmptyState compact icon={Users} title="No leads yet" actions={<Btn small href="/cybersecurity-assessment/" target="_blank">View public assessment <ExternalLink size={13} /></Btn>}>Leads from contact forms and assessments will appear here.</EmptyState> : (
            <ul className="space-y-1">
              {STATUS_ORDER.map((st, i) => {
                const n = d.pipeline.find((x: any) => x.status === st)?.n ?? 0;
                const row = (
                  <>
                    <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-heading"><span className="tnum w-4 text-xs text-muted">{i + 1}</span>{STATUS_LABEL[st]}</span><span className="tnum font-medium text-heading">{n}<span className="ml-1.5 text-xs font-normal text-muted">{pipeTotal ? Math.round((100 * n) / pipeTotal) : 0}%</span></span></div>
                    <div className="ml-6 mt-1.5 h-1.5 rounded-full bg-mist" aria-hidden="true"><div className="h-full rounded-full bg-[var(--a-chart-1)]" style={{ width: `${n ? Math.max(3, (100 * n) / pipeTotal) : 0}%`, opacity: st === "closed" ? 0.45 : 1 }} /></div>
                  </>
                );
                return <li key={st}>{leads ? <a href={`#/leads?status=${st}`} className="-mx-2 block rounded-lg px-2 py-1.5 hover:bg-mist">{row}</a> : <div className="py-1.5">{row}</div>}</li>;
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Attention />
        <Maturity m={d.maturity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WebsiteOverview w={d.website} />
        <RecentActivity />
      </div>
    </div>
  );
}

function Maturity({ m }: { m: any }) {
  const { user } = useAdmin();
  if (!m.sample) return (
    <Card className="xl:col-span-2" title="Cybersecurity maturity overview">
      <EmptyState icon={Gauge} title="No completed assessments in this period" actions={<><Btn small href="/cybersecurity-assessment/" target="_blank">Preview the assessment <ExternalLink size={13} /></Btn><Btn small href="#/templates">Manage templates</Btn></>}>
        Aggregated maturity scores, common gaps and recommended services will appear when businesses complete an assessment.
      </EmptyState>
    </Card>
  );
  return (
    <Card className="xl:col-span-2" title="Cybersecurity maturity overview" lead={`Aggregated from ${m.sample} assessment${m.sample === 1 ? "" : "s"} in this period. No organisation-level findings are shown here.`}
      actions={<a href="#/assessment-analytics" className="text-[0.8125rem] font-medium text-cobalt hover:underline">Assessment analytics</a>}>
      <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="flex flex-row items-center gap-4 lg:flex-col lg:items-start">
          <ScoreRing value={m.avg_score} label="Average maturity score" />
          <div className="space-y-1 text-sm"><p className="text-heading"><span className="font-semibold">Average score</span></p><p className="text-muted">Coverage {fmtPct(m.avg_coverage)}</p><p className="text-muted">Sample size {m.sample}</p>
            {m.sample < 5 && <p className="text-xs text-warn-fg">Small sample: treat averages with care.</p>}</div>
        </div>
        <div><h3 className="mb-2 text-[0.8125rem] font-semibold text-heading">By category (weakest first)</h3>
          <BarList max={100} rows={m.categories.map((x: any) => ({ key: x.key, label: x.name, value: x.avg ?? 0, text: `${x.avg ?? "–"} · n=${x.n}` }))} empty="No category scores." /></div>
        <div className="grid gap-6 md:col-span-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div><h3 className="mb-2 text-[0.8125rem] font-semibold text-heading">Most common critical gaps</h3>
            {m.gaps.length ? <ul className="space-y-1.5 text-sm">{m.gaps.map((g: any) => <li key={g.code} className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-start gap-2 text-heading"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-risk-fg" aria-hidden="true" /><span className="min-w-0">{g.title}</span></span><span className="tnum shrink-0 text-muted">{g.n} · {fmtPct(g.pct)}</span></li>)}</ul> : <p className="text-sm text-muted">No critical gaps recorded.</p>}</div>
          <div><h3 className="mb-2 text-[0.8125rem] font-semibold text-heading">Top recommended services</h3>
            {m.services.length ? <ul className="space-y-1.5 text-sm">{m.services.map((x: any) => <li key={x.key} className="flex justify-between gap-3"><span className="flex items-center gap-2 text-heading"><Sparkles size={14} className="text-brand-fg" aria-hidden="true" />{x.name}</span><span className="tnum text-muted">{x.n}</span></li>)}</ul> : <p className="text-sm text-muted">{can(user, "assessments") ? "No recommendations yet." : "Not available."}</p>}</div>
        </div>
      </div>
    </Card>
  );
}

function Attention() {
  const server = useLoadSimple("/attention");
  const site = useSiteContent();
  const { user } = useAdmin();
  const items = useMemo(() => {
    const out: { key: string; severity: "high" | "medium" | "low"; title: string; detail: string; count: number; href: string }[] = [...(server?.items ?? [])];
    if (site.items) {
      const drafts = site.items.filter((x) => x.kind === "article" && x.loc === "en" && x.status === "draft").length;
      if (drafts) out.push({ key: "drafts", severity: "low", title: "Draft articles awaiting publication", detail: "Drafts are hidden from the website.", count: drafts, href: "#/articles?status=draft".slice(2) });
      const enArticles = site.items.filter((x) => x.kind === "article" && x.loc === "en" && x.status === "published");
      const missingNl = enArticles.filter((a) => !site.items!.some((n) => n.loc === "nl" && n.baseKey === a.baseKey)).length;
      if (missingNl) out.push({ key: "translations", severity: "low", title: "Articles without a Dutch version", detail: "Dutch visitors see the English text with a note.", count: missingNl, href: "localization" });
      const seo = site.items.filter((x) => x.status === "published" && seoIssues(x, site.items!).some((i) => i.severity === "high")).length;
      if (seo) out.push({ key: "seo", severity: "medium", title: "Pages missing SEO metadata", detail: "No title or description for search results.", count: seo, href: "seo" });
    }
    const rank = { high: 0, medium: 1, low: 2 };
    return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [server, site.items]);
  const tone: Record<string, Tone> = { high: "risk", medium: "warn", low: "neutral" };
  const loading = server === null || site.loading;
  return (
    <Card title="Needs attention" lead="Generated from the current state of leads, email, security and content." pad={false}>
      {loading ? <div className="space-y-2 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : !items.length ? (
        <EmptyState compact icon={CheckCircle2} title="All clear">Nothing needs your attention right now{can(user, "leads") ? "" : " in the areas you can access"}.</EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((it) => (
            <li key={it.key}><a href={`#/${it.href.replace(/^#?\/?/, "")}`} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-surface-2">
              <span className="tnum mt-0.5 grid h-7 min-w-7 place-items-center rounded-lg bg-mist px-1.5 text-sm font-semibold text-heading">{it.count}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-heading">{it.title}</span><span className="mt-0.5 block text-xs text-muted">{it.detail}</span></span>
              <span className="flex shrink-0 items-center gap-2"><Badge tone={tone[it.severity]}>{it.severity === "high" ? "High" : it.severity === "medium" ? "Medium" : "Low"}</Badge><ArrowRight size={15} className="text-muted" aria-hidden="true" /></span>
            </a></li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function useLoadSimple(path: string) {
  const [d, setD] = useState<any>(null);
  useEffect(() => { let live = true; api("GET", path).then((x) => { if (live) setD(x); }).catch(() => { if (live) setD({ items: [] }); }); return () => { live = false; }; }, [path]);
  return d;
}

function WebsiteOverview({ w }: { w: any }) {
  const site = useSiteContent();
  const st = useMemo(() => {
    if (!site.items) return null;
    const en = site.items.filter((x) => x.loc === "en");
    const pages = en.filter((x) => x.kind === "page");
    const articles = en.filter((x) => x.kind === "article");
    return {
      pages: pages.length, editedPages: pages.filter((x) => x.edited).length, services: pages.filter((x) => x.group === "Services").length,
      published: articles.filter((x) => x.status === "published").length, drafts: articles.filter((x) => x.status === "draft").length,
      seo: site.items.filter((x) => x.status === "published" && seoIssues(x, site.items!).some((i) => i.severity === "high")).length,
    };
  }, [site.items]);
  const tile = (label: string, value: number | string, href: string, warn?: boolean) => (
    <a href={href} className="rounded-lg border border-line p-3 transition-colors hover:border-line-strong hover:bg-surface-2"><p className="text-xs text-muted">{label}</p><p className={`tnum mt-1 text-xl font-semibold ${warn ? "text-warn-fg" : "text-heading"}`}>{value}</p></a>
  );
  return (
    <Card title="Website" lead="Content managed in this Command Centre" actions={<a href="#/website" className="text-[0.8125rem] font-medium text-cobalt hover:underline">Pages</a>}>
      {!st ? <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3">
            {tile("Pages", st.pages, "#/website")}{tile("Services", st.services, "#/website?group=Services")}{tile("Published articles", st.published, "#/articles")}
            {tile("Draft articles", st.drafts, "#/articles?status=draft", st.drafts > 0)}{tile("Media assets", w.media, "#/media")}{tile("Missing SEO", st.seo, "#/seo", st.seo > 0)}
          </div>
          <h3 className="mb-2 mt-5 text-[0.8125rem] font-semibold text-heading">Recently updated</h3>
          {w.recent.length ? <ul className="space-y-2 text-sm">{w.recent.slice(0, 4).map((r: any, i: number) => <li key={i} className="flex items-start justify-between gap-3"><a href={`#/${r.doc_key.includes("article:") ? `articles/${r.doc_key.replace("article:", "")}` : `website/${encodeURIComponent(r.doc_key)}`}`} className="min-w-0 truncate text-cobalt hover:underline">{r.doc_key}</a><span className="shrink-0 text-xs text-muted">{r.user_name ?? "System"} · {timeAgo(r.created_at)}</span></li>)}</ul>
            : <p className="text-sm text-muted">No content changes yet. The site is showing its original text.</p>}
        </>
      )}
    </Card>
  );
}

function QuickActions() {
  const { user } = useAdmin();
  const acts: [string, string, string, LucideIcon, boolean][] = [
    ["#/website", "Manage pages", "Text, links, images and SEO", FileText, can(user, "view")],
    ["#/website/page%3Ahome", "Edit homepage", "Hero, sections and calls to action", Home, can(user, "content")],
    ["#/website?group=Services", "Services", "Service landing pages", Sparkles, can(user, "content")],
    ["#/articles?new=1", "Publish article", "Write a new insight", Newspaper, can(user, "content")],
    ["#/media?upload=1", "Upload image", "Add to the media library", ImagePlus, can(user, "content")],
    ["#/templates?new=1", "Create assessment", "New assessment template", ListPlus, can(user, "content")],
    ["#/leads?status=new", "Review new leads", "Contact and qualify", Users, can(user, "leads")],
    ["/", "View public website", "Opens in a new tab", ExternalLink, true],
  ];
  return (
    <section aria-labelledby="qa-h">
      <h2 id="qa-h" className="mb-3 text-[0.9375rem] font-semibold text-heading">Quick actions</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {acts.filter((a) => a[4]).map(([href, label, sub, I]) => (
          <li key={label}><a href={href} target={href === "/" ? "_blank" : undefined} rel={href === "/" ? "noopener" : undefined} className="group flex h-full items-center gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-[var(--a-shadow-card)] transition-colors hover:border-brand/40 hover:bg-brand-50">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-fg transition-colors group-hover:bg-brand group-hover:text-white"><I size={16} aria-hidden="true" /></span>
            <span className="min-w-0"><span className="block text-sm font-medium text-heading">{label}</span><span className="block text-xs text-muted">{sub}</span></span>
          </a></li>
        ))}
      </ul>
    </section>
  );
}

export function EventIcon({ type }: { type: string }) {
  const map: Record<string, [LucideIcon, string]> = { lead: [Users, "text-ok-fg bg-ok-bg"], consultation: [PhoneCall, "text-brand-fg bg-brand-50"], enquiry: [MessageSquare, "text-info-fg bg-info-bg"], assessment: [ClipboardCheck, "text-body bg-mist"], email_failed: [AlertTriangle, "text-risk-fg bg-risk-bg"], security: [UserCheck, "text-warn-fg bg-warn-bg"], audit: [ActivityIcon, "text-body bg-mist"] };
  const [I, cls] = map[type] ?? map.audit;
  return <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${cls}`}><I size={15} aria-hidden="true" /></span>;
}

function RecentActivity() {
  const d = useLoadSimple("/activity?limit=8");
  return (
    <Card title="Recent activity" actions={<a href="#/activity" className="text-[0.8125rem] font-medium text-cobalt hover:underline">Activity centre</a>} >
      {!d ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : !d.events?.length ? (
        <EmptyState compact icon={ActivityIcon} title="No activity yet">New enquiries, completed assessments and content changes will be listed here.</EmptyState>
      ) : (
        <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-line">
          {d.events.map((e: any) => (
            <li key={e.id} className="relative flex gap-3">
              <EventIcon type={e.type} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-heading">{e.href ? <a href={`#/${e.href}`} className="font-medium hover:underline">{e.title}</a> : <span className="font-medium">{e.title}</span>}</p>
                <p className="truncate text-xs text-muted">{[e.detail, e.actor].filter(Boolean).join(" · ")}</p>
              </div>
              <time className="shrink-0 pt-0.5 text-xs text-muted" dateTime={e.at}>{timeAgo(e.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
