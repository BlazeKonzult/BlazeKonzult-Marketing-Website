/* eslint-disable @typescript-eslint/no-explicit-any -- CRM views render loosely-typed API JSON */
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Download, ExternalLink, GripVertical, Inbox, Mail, MessageSquare, PhoneCall, Trash2, Users, AlertTriangle, ShieldAlert, StickyNote, Send } from "lucide-react";
import { api, can, download, fmtDate, fmtDay, isPast, L, timeAgo, STATUS_LABEL, STATUS_ORDER } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, Card, DL, EmptyState, ErrorBox, Field, FilterBar, inputCls, Loading, Page, Pager, SearchInput, StatusBadge, Tabs, confirmDialog, useDebounced, useLoad, Notice } from "./ui";
import { DataTable, type Column, type Sort } from "./datatable";
import { BarList } from "./charts";

const qs = (o: Record<string, string | number | undefined | null>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); const s = p.toString(); return s ? `?${s}` : ""; };
const prioTone = (p: string) => (p === "high" ? "risk" : p === "medium" ? "warn" : "neutral") as "risk" | "warn" | "neutral";
const SOURCES: Record<string, string> = { assessment: "Assessment", contact: "Contact form", checklist: "Checklist", newsletter: "Newsletter" };

type Variant = "all" | "consultations" | "enquiries" | "follow-ups";
const VARIANT: Record<Variant, { title: string; lead: string; fixed: Record<string, string>; empty: [string, string] }> = {
  all: { title: "All leads", lead: "Every lead from assessments, the contact form, checklists and the newsletter. Commercial priority is kept separate from security maturity.", fixed: {}, empty: ["No leads yet", "Leads generated through your contact forms and cybersecurity assessments will appear here."] },
  consultations: { title: "Consultation requests", lead: "Leads that asked to book a consultation.", fixed: { consultation: "1" }, empty: ["No consultation requests", "When someone asks for a consultation after an assessment or on the contact form, it appears here."] },
  enquiries: { title: "Contact enquiries", lead: "Messages sent through the website contact form.", fixed: { source: "contact" }, empty: ["No contact enquiries", "Messages from the contact page will appear here."] },
  "follow-ups": { title: "Follow-ups", lead: "Open leads with a follow-up date. Set a date on any lead to plan your next contact.", fixed: { followup: "1" }, empty: ["No follow-ups planned", "Open a lead and set a next follow-up date; it will appear here."] },
};

export function LeadsView({ variant }: { variant: Variant }) {
  const { user, notify, query } = useAdmin();
  const v = VARIANT[variant];
  const [f, setF] = useState({ q: "", status: query.get("status") ?? "", priority: "", source: "", assigned: "", from: "", to: "", page: 1, due: variant === "follow-ups" ? "1" : "" });
  const [sort, setSort] = useState<Sort>(variant === "follow-ups" ? { key: "follow_up", dir: "asc" } : null);
  const [sel, setSel] = useState<(number | string)[]>([]);
  const dq = useDebounced(f.q, 300);
  const params = { ...f, q: dq, ...v.fixed, sort: sort?.key, dir: sort?.dir, size: 25 };
  const { data, error, loading, reload } = useLoad(() => api("GET", `/leads${qs(params)}`), [JSON.stringify(params)]);
  const set = (patch: Partial<typeof f>) => { setF({ ...f, ...patch, page: patch.page ?? 1 }); setSel([]); };
  const bulk = async (body: Record<string, unknown>, label: string) => {
    try { const r = await api("POST", "/leads/bulk", { ids: sel, ...body }); notify(`${r.changed} lead${r.changed === 1 ? "" : "s"} ${label}.`); setSel([]); reload(); } catch (e) { notify((e as Error).message, "risk"); }
  };
  const users: any[] = data?.users ?? [];
  const columns: Column<any>[] = [
    { key: "contact", header: "Lead", mobile: "title", sort: "company", render: (l) => <div className="min-w-0"><a className="font-medium text-heading hover:text-brand hover:underline" href={`#/leads/${l.id}`}>{l.company || l.name || l.ref}</a><span className="block max-w-[18rem] truncate text-xs text-muted">{[l.company ? l.name : null, l.email].filter(Boolean).join(" · ")}</span></div> },
    { key: "email", header: "Business email", hideable: true, hidden: true, render: (l) => <span className="block max-w-[14rem] truncate">{l.email}</span> },
    { key: "industry", header: "Industry", hideable: true, hidden: true, render: (l) => l.industry ?? <span className="text-muted">–</span> },
    { key: "source", header: "Source", hideable: true, render: (l) => <span className="inline-flex items-center gap-1.5">{SOURCES[l.source] ?? l.source}{l.wants_consultation && <Badge tone="brand">Consultation</Badge>}</span> },
    { key: "service", header: "Requested service", hideable: true, hidden: true, render: (l) => (l.interests?.length ? <span className="block max-w-[12rem] truncate">{l.interests.join(", ")}</span> : l.template ?? <span className="text-muted">–</span>) },
    { key: "status", header: "Status", sort: "status", render: (l) => <StatusBadge status={l.status} label={STATUS_LABEL[l.status]} /> },
    { key: "priority", header: "Priority", sort: "priority", hideable: true, render: (l) => <Badge tone={prioTone(l.priority)}>{l.priority}</Badge> },
    { key: "assigned", header: "Assigned", hideable: true, render: (l) => l.assigned_name ?? <span className="text-muted">Unassigned</span> },
    { key: "created", header: "Created", sort: "created", hideable: true, render: (l) => <span className="whitespace-nowrap" title={fmtDate(l.created_at)}>{fmtDay(l.created_at)}</span> },
    { key: "contacted", header: "Last contact", sort: "contacted", hideable: true, hidden: variant === "all", render: (l) => l.last_contacted_at ? <span className="whitespace-nowrap">{fmtDay(l.last_contacted_at)}</span> : <span className="text-muted">Never</span> },
    { key: "follow", header: "Next follow-up", sort: "follow_up", hideable: true, render: (l) => l.next_follow_up_at ? <span className={`inline-flex items-center gap-1 whitespace-nowrap ${isPast(l.next_follow_up_at) && !["converted", "closed"].includes(l.status) ? "font-medium text-risk-fg" : ""}`}>{isPast(l.next_follow_up_at) && !["converted", "closed"].includes(l.status) && <AlertTriangle size={13} aria-label="Overdue" />}{fmtDay(l.next_follow_up_at)}</span> : <span className="text-muted">–</span> },
  ];
  const filtered = !!(f.q || f.status || f.priority || f.source || f.assigned || f.from || f.to);
  return (
    <Page title={v.title} lead={v.lead}
      actions={can(user, "export") && <Btn onClick={() => download(`/leads/export.csv${qs({ ...params, page: undefined, size: undefined })}`, `${variant}.csv`).catch((e) => notify(e.message, "risk"))}><Download size={15} /> Export CSV</Btn>}>
      {variant === "follow-ups" && <Tabs label="Follow-up view" value={f.due === "1" ? "due" : "all"} onChange={(k) => set({ due: k === "due" ? "1" : "" })} tabs={[{ key: "due", label: "Due now" }, { key: "all", label: "All planned" }]} />}
      <FilterBar actions={filtered ? <Btn small kind="subtle" onClick={() => set({ q: "", status: "", priority: "", source: "", assigned: "", from: "", to: "" })}>Clear filters</Btn> : undefined}>
        <div className="!min-w-[14rem] flex-[2]"><SearchInput value={f.q} onChange={(q) => set({ q })} placeholder="Name, company, email or reference" label="Search leads" /></div>
        <Field label="Status"><select className={inputCls} value={f.status} onChange={(e) => set({ status: e.target.value })}><option value="">All statuses</option>{STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}</select></Field>
        <Field label="Priority"><select className={inputCls} value={f.priority} onChange={(e) => set({ priority: e.target.value })}><option value="">Any</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
        {variant !== "enquiries" && <Field label="Source"><select className={inputCls} value={f.source} onChange={(e) => set({ source: e.target.value })}><option value="">All sources</option>{Object.entries(SOURCES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>}
        <Field label="Assigned"><select className={inputCls} value={f.assigned} onChange={(e) => set({ assigned: e.target.value })}><option value="">Anyone</option><option value="none">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Created from"><input type="date" className={inputCls} value={f.from} onChange={(e) => set({ from: e.target.value })} /></Field>
        <Field label="Created to"><input type="date" className={inputCls} value={f.to} onChange={(e) => set({ to: e.target.value })} /></Field>
      </FilterBar>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : (
        <>
          <DataTable id="leads" caption={v.title} columns={columns} rows={data?.leads ?? null} loading={loading && !data} sort={sort} onSort={(s) => { setSort(s); set({}); }}
            selectable selected={sel} onSelect={setSel} rowHref={(l) => `#/leads/${l.id}`}
            bulk={<>
              <select aria-label="Change status of selected leads" className={`${inputCls} min-h-8 w-auto py-1 text-[0.8125rem]`} value="" onChange={(e) => e.target.value && bulk({ status: e.target.value }, "updated")}><option value="">Set status…</option>{STATUS_ORDER.map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}</select>
              <select aria-label="Assign selected leads" className={`${inputCls} min-h-8 w-auto py-1 text-[0.8125rem]`} value="" onChange={(e) => e.target.value && bulk({ assigned_to: e.target.value === "none" ? null : Number(e.target.value) }, "reassigned")}><option value="">Assign to…</option><option value="none">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              <select aria-label="Set priority of selected leads" className={`${inputCls} min-h-8 w-auto py-1 text-[0.8125rem]`} value="" onChange={(e) => e.target.value && bulk({ priority: e.target.value }, "updated")}><option value="">Priority…</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            </>}
            empty={filtered ? <EmptyState compact icon={Inbox} title="No leads match these filters" actions={<Btn small onClick={() => set({ q: "", status: "", priority: "", source: "", assigned: "", from: "", to: "" })}>Clear filters</Btn>}>Try a broader search or another status.</EmptyState>
              : <EmptyState icon={variant === "follow-ups" ? CalendarClock : variant === "consultations" ? PhoneCall : variant === "enquiries" ? MessageSquare : Users} title={v.empty[0]}
                actions={<><Btn small href="/cybersecurity-assessment/" target="_blank">View public assessment <ExternalLink size={13} /></Btn>{can(user, "settings") && <Btn small href="#/settings">Review lead capture settings</Btn>}</>}>{v.empty[1]}</EmptyState>} />
          {data && <Pager page={data.page} size={data.size} total={data.total} onPage={(p) => set({ page: p })} />}
        </>
      )}
    </Page>
  );
}

/* --------------------------------- Pipeline --------------------------------- */
export function Pipeline() {
  const { notify } = useAdmin();
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);
  const { data, error, loading, reload, setData } = useLoad(() => api("GET", `/leads/pipeline${qs({ q: dq })}`), [dq]);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const move = async (id: number, status: string) => {
    const lead = data.leads.find((l: any) => l.id === id);
    if (!lead || lead.status === status) return;
    setData({ ...data, leads: data.leads.map((l: any) => (l.id === id ? { ...l, status } : l)) });
    try { await api("PATCH", `/leads/${id}`, { status }); notify(`${lead.company || lead.name || lead.ref} moved to ${STATUS_LABEL[status]}.`); }
    catch (e) { notify((e as Error).message, "risk"); reload(); }
  };
  return (
    <Page title="Lead pipeline" lead="Drag a card to another stage, or use the arrow buttons on each card. Every change is saved and recorded in the audit log."
      actions={<SearchInput value={q} onChange={setQ} placeholder="Filter cards" label="Filter pipeline" className="w-64" />}>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : loading && !data ? <Loading /> : !data.leads.length && !dq ? (
        <EmptyState icon={Users} title="Your pipeline is empty" actions={<Btn small href="/cybersecurity-assessment/" target="_blank">View public assessment <ExternalLink size={13} /></Btn>}>Leads from contact forms and assessments will appear in the New column.</EmptyState>
      ) : (
        <>
          <div className="relative -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="grid min-w-max auto-cols-[17.5rem] grid-flow-col gap-4">
              {STATUS_ORDER.map((st, si) => {
                const cards = data.leads.filter((l: any) => l.status === st);
                return (
                  <section key={st} aria-label={`${STATUS_LABEL[st]}, ${cards.length} leads`}
                    onDragOver={(e) => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver((o) => (o === st ? null : o))} onDrop={(e) => { e.preventDefault(); setOver(null); if (drag) move(drag, st); setDrag(null); }}
                    className={`flex max-h-[calc(100vh-15rem)] min-h-64 flex-col rounded-xl border bg-surface-2 transition-colors ${over === st ? "border-brand bg-brand-50" : "border-line"}`}>
                    <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-heading"><StatusBadge status={st} label={STATUS_LABEL[st]} /></h2>
                      <span className="tnum rounded-full bg-surface px-2 text-xs font-medium text-muted ring-1 ring-line">{cards.length}</span>
                    </header>
                    <ul className="flex-1 space-y-2 overflow-y-auto p-2">
                      {cards.length === 0 && <li className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-xs text-muted">Drop a lead here</li>}
                      {cards.map((l: any) => (
                        <li key={l.id} draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)}
                          className={`group rounded-lg border border-line bg-surface p-3 shadow-[var(--a-shadow-card)] transition-shadow hover:shadow-[0_4px_12px_-4px_rgb(16_24_40/0.15)] ${drag === l.id ? "opacity-50" : ""}`}>
                          <div className="flex items-start gap-1.5">
                            <GripVertical size={14} className="mt-0.5 shrink-0 cursor-grab text-muted/60" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                              <a href={`#/leads/${l.id}`} className="block truncate text-sm font-medium text-heading hover:text-brand hover:underline">{l.company || l.name || l.ref}</a>
                              <p className="truncate text-xs text-muted">{[l.company ? l.name : null, SOURCES[l.source]].filter(Boolean).join(" · ")}</p>
                            </div>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={prioTone(l.priority)}>{l.priority}</Badge>
                            {l.wants_consultation && <Badge tone="brand">Consultation</Badge>}
                            {l.next_follow_up_at && <span className={`inline-flex items-center gap-1 text-xs ${isPast(l.next_follow_up_at) ? "font-medium text-risk-fg" : "text-muted"}`}><CalendarClock size={12} aria-hidden="true" />{fmtDay(l.next_follow_up_at)}{isPast(l.next_follow_up_at) && <span className="sr-only"> (overdue)</span>}</span>}
                          </div>
                          <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
                            <span className="truncate">{l.assigned_name ?? "Unassigned"} · {timeAgo(l.updated_at)}</span>
                            <span className="flex shrink-0 gap-0.5">
                              <button type="button" disabled={si === 0} onClick={() => move(l.id, STATUS_ORDER[si - 1])} className="rounded p-1 hover:bg-mist hover:text-heading disabled:opacity-30" aria-label={`Move ${l.company || l.name} to ${si > 0 ? STATUS_LABEL[STATUS_ORDER[si - 1]] : ""}`}><ChevronLeft size={15} /></button>
                              <button type="button" disabled={si === STATUS_ORDER.length - 1} onClick={() => move(l.id, STATUS_ORDER[si + 1])} className="rounded p-1 hover:bg-mist hover:text-heading disabled:opacity-30" aria-label={`Move ${l.company || l.name} to ${si < STATUS_ORDER.length - 1 ? STATUS_LABEL[STATUS_ORDER[si + 1]] : ""}`}><ChevronRight size={15} /></button>
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted">{data.note}</p>
        </>
      )}
    </Page>
  );
}

/* ------------------------------- Lead workspace ------------------------------- */
export function LeadWorkspace({ id }: { id: number }) {
  const { user, notify, go, refreshCounts } = useAdmin();
  const { data, error, loading, reload, setData } = useLoad(() => api("GET", `/leads/${id}`), [id]);
  const tl = useLoad(() => api("GET", `/leads/${id}/timeline`), [id, data?.lead?.updated_at]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [follow, setFollow] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the follow-up field with the loaded lead
  useEffect(() => { if (data?.lead) setFollow(data.lead.next_follow_up_at ? data.lead.next_follow_up_at.slice(0, 10) : ""); }, [data?.lead]);
  const timeline = useMemo(() => {
    if (!data) return [];
    const ev: { at: string; kind: string; text: string; actor?: string; body?: string; tone?: string }[] = [];
    for (const n of data.notes) ev.push({ at: n.created_at, kind: "note", text: "Note", actor: n.author ?? "System", body: n.note });
    for (const m of data.emails) ev.push({ at: m.sent_at ?? m.created_at, kind: "email", text: `Email: ${m.kind.replace(/_/g, " ")} (${m.status})`, actor: "System", tone: m.status === "failed" ? "risk" : undefined });
    for (const e of tl.data?.events ?? []) if (e.action !== "lead.note") ev.push({ at: e.at, kind: e.action === "lead.created" ? "created" : "change", text: e.text, actor: e.actor });
    return ev.sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [data, tl.data]);
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const l = data.lead;
  const patch = async (b: Record<string, unknown>, msg = "Lead updated.") => {
    setSaving(true);
    try { const r = await api("PATCH", `/leads/${id}`, b); setData({ ...data, lead: r.lead ?? { ...l, ...b } }); notify(msg); refreshCounts(); } catch (e) { notify((e as Error).message, "risk"); }
    setSaving(false);
  };
  const si = STATUS_ORDER.indexOf(l.status);
  const a = data.assessment;
  return (
    <Page eyebrow={<a href="#/leads" className="hover:text-heading">← All leads</a>} title={l.company || l.name || l.ref}
      meta={<><StatusBadge status={l.status} label={STATUS_LABEL[l.status]} /><Badge tone={prioTone(l.priority)}>{l.priority} priority</Badge><span>{SOURCES[l.source] ?? l.source}</span><span aria-hidden="true">·</span><span>{l.ref}</span><span aria-hidden="true">·</span><span>Received {fmtDate(l.created_at)}</span></>}
      actions={<>
        {l.email && <Btn href={`mailto:${l.email}`}><Mail size={15} /> Email</Btn>}
        <Btn onClick={() => patch({ last_contacted_at: "now", ...(l.status === "new" ? { status: "contacted" } : {}) }, "Marked as contacted.")} busy={saving}><Check size={15} /> Mark contacted</Btn>
        {can(user, "export") && <Btn onClick={() => download(`/leads/${id}/export`, `lead-${l.ref}.json`)} label="Export data (GDPR)" title="Export all data held about this lead"><Download size={15} /></Btn>}
        {can(user, "delete") && <Btn kind="danger" label="Erase lead" title="Erase lead" onClick={async () => { if (!(await confirmDialog({ title: "Erase this lead?", body: "The lead, its assessment, notes and report links are permanently deleted. This cannot be undone.", confirmLabel: "Erase permanently", danger: true }))) return; await api("DELETE", `/leads/${id}`); notify("Lead erased."); refreshCounts(); go("leads"); }}><Trash2 size={15} /></Btn>}
      </>}>
      <ol className="mb-6 hidden overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--a-shadow-card)] lg:flex" aria-label="Pipeline stage">
        {STATUS_ORDER.map((st, i) => (
          <li key={st} className="flex-1"><button type="button" onClick={() => patch({ status: st }, `Moved to ${STATUS_LABEL[st]}.`)} aria-current={st === l.status ? "step" : undefined}
            className={`flex h-11 w-full items-center justify-center gap-1.5 border-r border-line px-2 text-[0.8125rem] font-medium transition-colors last:border-r-0 ${st === l.status ? "bg-brand text-white" : i < si ? "bg-brand-50 text-brand-fg hover:bg-brand-50/70" : "text-muted hover:bg-surface-2 hover:text-heading"}`}>
            {i < si && <Check size={14} aria-hidden="true" />}{STATUS_LABEL[st]}
          </button></li>
        ))}
      </ol>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Contact">
              <DL rows={[["Name", l.name], ["Business email", l.email && <a className="text-cobalt hover:underline" href={`mailto:${l.email}`}>{l.email}</a>], ["Telephone", l.phone && <a className="text-cobalt hover:underline" href={`tel:${l.phone}`}>{l.phone}</a>], ["Job title", l.job_title], ["Preferred contact", l.details.contact_method], ["Language", l.locale === "nl" ? "Dutch" : "English"]]} />
            </Card>
            <Card title="Company">
              <DL rows={[["Company", l.company], ["Sector", l.details.industry ?? l.details.sector], ["Company size", l.details.company_size], ["Timeframe", l.details.timeframe], ["Interests", (l.details.interests ?? []).join(", ")], ["Need", l.details.need]]} />
            </Card>
          </div>
          {(l.message || l.wants_report || l.wants_consultation) && (
            <Card title="Request">
              <div className="mb-3 flex flex-wrap gap-2">{l.wants_consultation && <Badge tone="brand">Consultation requested</Badge>}{l.wants_report && <Badge tone="info">PDF report requested</Badge>}</div>
              {l.message ? <p className="whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm text-heading">{l.message}</p> : <p className="text-sm text-muted">No message.</p>}
            </Card>
          )}
          {a && (
            <Card title="Assessment summary" lead="Security maturity is separate from commercial priority." actions={can(user, "assessments") && <Btn small href={`#/assessments/${a.id}`}>Full result <ExternalLink size={13} /></Btn>}>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <p><span className="text-muted">Assessment</span> <span className="font-medium text-heading">{a.template}</span></p>
                <p><span className="text-muted">Score</span> <span className="tnum font-semibold text-heading">{a.overall_score ?? "–"}</span> <span className="text-muted">({a.classification ?? "–"})</span></p>
                <p><span className="text-muted">Coverage</span> <span className="tnum text-heading">{a.coverage ?? "–"}%</span></p>
              </div>
              {a.gaps.length > 0 && <ul className="mt-4 space-y-1.5 text-sm">{a.gaps.map((g: any) => <li key={g.code} className="flex items-start gap-2"><ShieldAlert size={15} className="mt-0.5 shrink-0 text-risk-fg" aria-hidden="true" /><span className="text-heading">{L(g.title)}</span><Badge tone="risk">{g.risk}</Badge></li>)}</ul>}
              <div className="mt-4"><BarList max={100} rows={a.categories.map((c: any) => ({ key: c.key ?? L(c.name), label: L(c.name), value: c.score ?? 0, text: c.score === null ? "n/a" : String(c.score) }))} /></div>
            </Card>
          )}
          <Card title="Activity timeline" lead="Notes, emails and every change to this lead.">
            {timeline.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
              <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[0.9375rem] before:top-2 before:w-px before:bg-line">
                {timeline.map((e, i) => (
                  <li key={i} className="relative flex gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-surface ${e.kind === "note" ? "bg-warn-bg text-warn-fg" : e.kind === "email" ? (e.tone ? "bg-risk-bg text-risk-fg" : "bg-info-bg text-info-fg") : e.kind === "created" ? "bg-ok-bg text-ok-fg" : "bg-mist text-body"}`}>
                      {e.kind === "note" ? <StickyNote size={14} aria-hidden="true" /> : e.kind === "email" ? <Send size={14} aria-hidden="true" /> : e.kind === "created" ? <Inbox size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-sm text-heading"><span className="font-medium">{e.text}</span> <span className="text-xs text-muted">· {e.actor} · <time dateTime={e.at} title={fmtDate(e.at)}>{timeAgo(e.at)}</time></span></p>
                      {e.body && <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-sm text-body">{e.body}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Pipeline & follow-up">
            <div className="grid gap-4">
              <Field label="Status"><select className={inputCls} value={l.status} onChange={(e) => patch({ status: e.target.value })}>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
              <Field label="Commercial priority" hint={`Calculated score ${l.priority_score} from consultation interest, company size and needs. Never from the security score.`}><select className={inputCls} value={l.priority} onChange={(e) => patch({ priority: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
              <Field label="Assigned to"><select className={inputCls} value={l.assigned_to ?? ""} onChange={(e) => patch({ assigned_to: e.target.value || null })}><option value="">Unassigned</option>{data.users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
              <div>
                <Field label="Next follow-up" hint={l.next_follow_up_at && isPast(l.next_follow_up_at) ? undefined : "You'll see it under Follow-ups and in Needs attention when it's due."} error={l.next_follow_up_at && isPast(l.next_follow_up_at) && !["converted", "closed"].includes(l.status) ? "This follow-up is overdue." : null}>
                  <div className="flex gap-2"><input type="date" className={inputCls} value={follow} onChange={(e) => setFollow(e.target.value)} />
                    <Btn onClick={() => patch({ next_follow_up_at: follow || null }, follow ? "Follow-up saved." : "Follow-up cleared.")} disabled={follow === (l.next_follow_up_at?.slice(0, 10) ?? "")}>Save</Btn></div>
                </Field>
                <div className="mt-2 flex flex-wrap gap-1.5">{[[1, "Tomorrow"], [3, "In 3 days"], [7, "Next week"]].map(([d, lbl]) => <button key={d} type="button" className="rounded-md border border-line px-2 py-1 text-xs text-body hover:bg-mist" onClick={() => { const v = new Date(Date.now() + (d as number) * 86400_000).toISOString().slice(0, 10); setFollow(v); patch({ next_follow_up_at: v }, `Follow-up set for ${fmtDay(v)}.`); }}>{lbl}</button>)}</div>
              </div>
              <DL rows={[["Last contact", l.last_contacted_at ? fmtDate(l.last_contacted_at) : "Never"], ["Privacy consent", fmtDate(l.consent_privacy_at)], ["Marketing consent", l.consent_marketing ? "Yes" : "No"]]} />
            </div>
          </Card>
          <Card title="Add a note" lead="Notes are encrypted and visible to staff with lead access.">
            <form onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; try { await api("POST", `/leads/${id}/notes`, { note }); setNote(""); notify("Note added."); reload(); } catch (x) { notify((x as Error).message, "risk"); } }}>
              <textarea className={inputCls} rows={4} value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" placeholder="Call summary, next steps, decisions…" maxLength={5000} />
              <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted">{note.length}/5000</span><Btn type="submit" kind="primary" small disabled={!note.trim()}>Add note</Btn></div>
            </form>
          </Card>
          <Card title="Communication history">
            {data.emails.length ? <ul className="divide-y divide-line text-sm">{data.emails.map((m: any) => <li key={m.id} className="flex items-center justify-between gap-2 py-2"><span className="text-heading">{m.kind.replace(/_/g, " ")}</span><span className="flex items-center gap-2"><StatusBadge status={m.status} /><span className="text-xs text-muted">{fmtDay(m.sent_at ?? m.created_at)}</span></span></li>)}</ul>
              : <p className="text-sm text-muted">No emails have been sent to this lead.</p>}
            {data.emails.some((m: any) => m.status === "failed") && <div className="mt-3"><Notice tone="warn">A delivery failed. Retry it from Email delivery.</Notice></div>}
          </Card>
        </div>
      </div>
    </Page>
  );
}
