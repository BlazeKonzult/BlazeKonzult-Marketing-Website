/* eslint-disable @typescript-eslint/no-explicit-any -- admin views render loosely-typed API JSON */
"use client";

import { useState } from "react";
import { Download, ExternalLink, RefreshCw } from "lucide-react";
import { api, can, download, fmtDate, L, STATUS_LABEL } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, Card, Empty, ErrorBox, Field, inputCls, Loading, Page, Pager, Table, Td, useLoad, confirmDialog } from "./ui";

const prioTone = (p: string) => (p === "high" ? "risk" : p === "medium" ? "warn" : "neutral") as "risk" | "warn" | "neutral";
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${v}%`);
const qs = (o: Record<string, string | number | undefined>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") p.set(k, String(v)); const s = p.toString(); return s ? `?${s}` : ""; };

const Kpi = ({ label, value, sub }: { label: string; value: number | string; sub?: string }) => (
  <div className="rounded-xl border border-line bg-surface p-4 shadow-[var(--a-shadow-card)]"><p className="text-[0.8125rem] text-muted">{label}</p><p className="tnum mt-1 text-[1.75rem] font-semibold leading-tight text-heading">{value}</p>{sub && <p className="mt-1 text-xs text-muted">{sub}</p>}</div>
);

export function Bars({ rows, max }: { rows: { label: string; value: number; text: string }[]; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5 text-sm">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3"><span className="truncate text-heading">{r.label}</span><span className="shrink-0 text-muted">{r.text}</span></div>
          <div className="mt-1 h-2 rounded-full bg-mist" aria-hidden="true"><div className="h-full rounded-full bg-cobalt" style={{ width: `${Math.max(2, (100 * r.value) / m)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Assessments ------------------------------ */
export function Assessments() {
  const { user } = useAdmin();
  const [f, setF] = useState({ template: "", classification: "", from: "", to: "", lead: "", page: 1 });
  const { data, error, loading } = useLoad(() => api("GET", `/assessments${qs(f)}`), [JSON.stringify(f)]);
  return (
    <Page title="Completed assessments" lead="Results are shown without contact details unless a lead was created."
      actions={can(user, "export") && <Btn onClick={() => download(`/assessments/export.csv${qs({ ...f, page: undefined })}`, "assessments.csv")}><Download size={15} /> Export CSV</Btn>}>
      <Filters>
        <Field label="Template"><input className={inputCls} placeholder="slug" value={f.template} onChange={(e) => setF({ ...f, template: e.target.value, page: 1 })} /></Field>
        <Field label="Classification"><select className={inputCls} value={f.classification} onChange={(e) => setF({ ...f, classification: e.target.value, page: 1 })}><option value="">All</option>{["initial", "developing", "established", "advanced", "highly_mature"].map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Lead"><select className={inputCls} value={f.lead} onChange={(e) => setF({ ...f, lead: e.target.value, page: 1 })}><option value="">All</option><option value="1">With lead</option><option value="0">Anonymous</option></select></Field>
        <Field label="From"><input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, page: 1 })} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value, page: 1 })} /></Field>
      </Filters>
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : !data.assessments.length ? <Empty>No assessments match these filters.</Empty> : (
        <>
          <Table head={["Reference", "Date", "Template", "Score", "Level", "Coverage", "Gaps", "Profile", "Lead"]}>
            {data.assessments.map((a: any) => (
              <tr key={a.id} className="hover:bg-paper">
                <Td><a className="font-semibold text-cobalt" href={`#/assessments/${a.id}`}>{a.public_ref}</a></Td>
                <Td>{fmtDate(a.created_at)}</Td><Td>{a.template} v{a.version}</Td><Td className="font-semibold text-heading">{a.overall_score ?? "–"}</Td>
                <Td>{a.classification ?? "–"}</Td><Td>{pct(a.coverage)}</Td><Td>{a.gaps > 0 ? <Badge tone="risk">{a.gaps}</Badge> : 0}</Td>
                <Td className="text-xs">{[a.company_size, a.industry, a.country].filter(Boolean).join(" · ")}</Td>
                <Td>{a.lead_id ? <a className="text-cobalt" href={`#/leads/${a.lead_id}`}>View</a> : "–"}</Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} size={data.size} total={data.total} onPage={(p) => setF({ ...f, page: p })} />
        </>
      )}
    </Page>
  );
}

const Filters = ({ children }: { children: React.ReactNode }) => <div className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-4 shadow-[var(--a-shadow-card)] sm:grid-cols-3 lg:grid-cols-5">{children}</div>;

export function AssessmentDetail({ id }: { id: number }) {
  const { user, notify, go } = useAdmin();
  const { data, error, loading } = useLoad(() => api("GET", `/assessments/${id}`), [id]);
  const [link, setLink] = useState<{ url: string; expires_at: string } | null>(null);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox>{error}</ErrorBox>;
  const r = data.result; const a = data.assessment;
  const answerText = (q: any, v: any) => {
    if (v === undefined) return <span className="text-muted">Not shown / not answered</span>;
    if (v === "na") return "Not applicable"; if (v === "unsure") return "Not sure";
    if (q.type === "maturity") return `${v} / 4`;
    if (q.options) return (Array.isArray(v) ? v : [v]).map((x: any) => L(q.options.find((o: any) => String(o.value) === String(x))?.label) || x).join(", ");
    return String(v);
  };
  return (
    <Page title={`Assessment ${a.ref}`} lead={`${a.template} v${a.version} · ${fmtDate(a.created_at)} · ${a.locale.toUpperCase()}`}
      actions={<>
        <Btn onClick={async () => { const x = await api("POST", `/assessments/${id}/recompute`, {}); notify(x.reproducible ? "Recomputed from the stored version: identical result." : "Recomputed result differs from the stored result.", x.reproducible ? "ok" : "risk"); }}><RefreshCw size={15} /> Verify reproducibility</Btn>
        {can(user, "reports") && <Btn onClick={() => download(`/assessments/${id}/report.pdf`, `report-${a.ref}.pdf`)}><Download size={15} /> PDF</Btn>}
        {can(user, "reports") && <Btn onClick={async () => setLink(await api("POST", `/assessments/${id}/report-link`, {}))}>New download link</Btn>}
        {can(user, "delete") && <Btn kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Permanently delete this assessment (and its lead, if any)? This cannot be undone.", danger: true, confirmLabel: "Confirm" }))) return; await api("DELETE", `/assessments/${id}`); notify("Assessment deleted."); go("assessments"); }}>Delete</Btn>}
      </>}>
      {link && <p className="mb-4 rounded-md border border-line bg-surface p-3 text-sm">Share this link with the participant (shown once, expires {fmtDate(link.expires_at)}): <code className="break-all text-xs">{link.url}</code></p>}
      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Score" value={r.overall ?? "–"} sub={L(r.classification?.label)} /><Kpi label="Coverage" value={pct(r.coverage)} /><Kpi label="Uncertainty" value={pct(r.uncertainty)} /><Kpi label="Critical gaps" value={(r.gaps ?? []).length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Domains"><Bars max={100} rows={(r.categories ?? []).map((c: any) => ({ label: L(c.name), value: c.score ?? 0, text: c.score === null ? "n/a" : `${c.score} · ${L(c.level?.label)}` }))} /></Card>
        <Card title="Critical gaps">{(r.gaps ?? []).length ? <ul className="space-y-2 text-sm">{(r.gaps ?? []).map((g: any) => <li key={g.code}><Badge tone="risk">{g.risk}</Badge> {L(g.title)} <span className="text-muted">({g.answer})</span></li>)}</ul> : <Empty>None</Empty>}</Card>
        <Card title="Recommendations" className="lg:col-span-2"><ol className="list-decimal space-y-1.5 pl-5 text-sm">{(r.recommendations ?? []).map((x: any) => <li key={x.code}><strong className="text-heading">{L(x.title)}</strong> <Badge tone={x.priority === "critical" ? "risk" : x.priority === "high" ? "warn" : "neutral"}>{x.priority}</Badge> <span className="text-muted">{x.service}</span></li>)}</ol></Card>
        <Card title="Answers" className="lg:col-span-2">
          <Table head={["Question", "Answer"]}>{data.questions.map((q: any) => <tr key={q.code}><Td><span className="text-xs text-muted">{q.code}</span><br />{L(q.title)}</Td><Td>{answerText(q, data.answers[q.code])}</Td></tr>)}</Table>
        </Card>
        {data.lead && <Card title="Lead"><a className="text-cobalt" href={`#/leads/${data.lead.id}`}>{data.lead.public_ref} · {STATUS_LABEL[data.lead.status]}</a></Card>}
      </div>
    </Page>
  );
}

/* --------------------------------- Leads --------------------------------- */
export function Leads() {
  const { user } = useAdmin();
  const [f, setF] = useState({ q: "", status: "", priority: "", source: "", consultation: "", page: 1 });
  const { data, error, loading } = useLoad(() => api("GET", `/leads${qs(f)}`), [JSON.stringify(f)]);
  return (
    <Page title="Leads" lead="Commercial priority is separate from security maturity."
      actions={can(user, "export") && <Btn onClick={() => download(`/leads/export.csv${qs({ ...f, page: undefined })}`, "leads.csv")}><Download size={15} /> Export CSV</Btn>}>
      <Filters>
        <Field label="Search"><input className={inputCls} placeholder="Name, company, email, ref" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value, page: 1 })} /></Field>
        <Field label="Status"><select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}><option value="">All</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Priority"><select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value, page: 1 })}><option value="">All</option><option>high</option><option>medium</option><option>low</option></select></Field>
        <Field label="Source"><select className={inputCls} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value, page: 1 })}><option value="">All</option><option>assessment</option><option>contact</option><option>checklist</option><option>newsletter</option></select></Field>
        <Field label="Consultation"><select className={inputCls} value={f.consultation} onChange={(e) => setF({ ...f, consultation: e.target.value, page: 1 })}><option value="">All</option><option value="1">Requested</option></select></Field>
      </Filters>
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : !data.leads.length ? <Empty>No leads match these filters.</Empty> : (
        <>
          <Table head={["Company", "Contact", "Source", "Priority", "Status", "Score", "Received"]}>
            {data.leads.map((l: any) => (
              <tr key={l.id} className="hover:bg-paper">
                <Td><a className="font-semibold text-cobalt" href={`#/leads/${l.id}`}>{l.company || "–"}</a><br /><span className="text-xs text-muted">{l.ref}</span></Td>
                <Td>{l.name}<br /><span className="text-xs text-muted">{l.email}</span></Td>
                <Td>{l.source}{l.wants_consultation && <><br /><Badge tone="brand">consultation</Badge></>}</Td>
                <Td><Badge tone={prioTone(l.priority)}>{l.priority}</Badge></Td><Td>{STATUS_LABEL[l.status]}</Td>
                <Td>{l.overall_score ?? "–"}{l.classification && <span className="text-xs text-muted"> {l.classification}</span>}</Td><Td>{fmtDate(l.created_at)}</Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} size={data.size} total={data.total} onPage={(p) => setF({ ...f, page: p })} />
        </>
      )}
    </Page>
  );
}

export function LeadDetail({ id }: { id: number }) {
  const { user, notify, go } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", `/leads/${id}`), [id]);
  const [note, setNote] = useState("");
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox>{error}</ErrorBox>;
  const l = data.lead;
  const patch = async (b: Record<string, unknown>) => { try { await api("PATCH", `/leads/${id}`, b); notify("Lead updated."); reload(); } catch (e) { notify((e as Error).message, "risk"); } };
  const row = (k: string, v: React.ReactNode) => <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-1.5"><dt className="text-muted">{k}</dt><dd className="break-words text-heading">{v || "–"}</dd></div>;
  return (
    <Page title={l.company || l.ref} lead={`${l.ref} · ${l.source} · received ${fmtDate(l.created_at)}`}
      actions={<>
        {can(user, "export") && <Btn onClick={() => download(`/leads/${id}/export`, `lead-${l.ref}.json`)}><Download size={15} /> Data export</Btn>}
        {can(user, "delete") && <Btn kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Erase this lead and all linked data (assessment, notes, report links)? This cannot be undone.", danger: true, confirmLabel: "Confirm" }))) return; await api("DELETE", `/leads/${id}`); notify("Lead erased."); go("leads"); }}>Erase</Btn>}
      </>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card title="Contact">
            <dl className="text-sm">
              {row("Name", l.name)}{row("Email", l.email && <a className="text-cobalt" href={`mailto:${l.email}`}>{l.email}</a>)}{row("Phone", l.phone)}{row("Job title", l.job_title)}
              {row("Preferred contact", l.details.contact_method)}{row("Timeframe", l.details.timeframe)}{row("Company size", l.details.company_size)}{row("Sector", l.details.industry ?? l.details.sector)}
              {row("Need", l.details.need)}{row("Interests", (l.details.interests ?? []).join(", "))}{row("Message", l.message && <span className="whitespace-pre-wrap">{l.message}</span>)}
              {row("Requests", [l.wants_report && "PDF report", l.wants_consultation && "Consultation"].filter(Boolean).join(", "))}
              {row("Privacy consent", fmtDate(l.consent_privacy_at))}{row("Marketing consent", l.consent_marketing ? "Yes" : "No")}{row("Language", l.locale)}
            </dl>
          </Card>
          {data.assessment && (
            <Card title="Assessment summary" actions={can(user, "assessments") && <a className="inline-flex items-center gap-1 text-sm text-cobalt" href={`#/assessments/${data.assessment.id}`}>Full result <ExternalLink size={13} /></a>}>
              <p className="text-sm text-body">{data.assessment.template} · score <strong className="text-heading">{data.assessment.overall_score ?? "–"}</strong> ({data.assessment.classification}) · coverage {pct(data.assessment.coverage)} · uncertainty {pct(data.assessment.uncertainty)}</p>
              {data.assessment.gaps.length > 0 && <ul className="mt-3 space-y-1 text-sm">{data.assessment.gaps.map((g: any) => <li key={g.code}><Badge tone="risk">{g.risk}</Badge> {L(g.title)}</li>)}</ul>}
              <div className="mt-4"><Bars max={100} rows={data.assessment.categories.map((c: any) => ({ label: L(c.name), value: c.score ?? 0, text: c.score === null ? "n/a" : String(c.score) }))} /></div>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card title="Pipeline">
            <div className="grid gap-3">
              <Field label="Status"><select className={inputCls} value={l.status} onChange={(e) => patch({ status: e.target.value })}>{data.statuses.map((s: string) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
              <Field label="Priority" hint={`Calculated score ${l.priority_score}; you can override it.`}><select className={inputCls} value={l.priority} onChange={(e) => patch({ priority: e.target.value })}><option>high</option><option>medium</option><option>low</option></select></Field>
              <Field label="Assigned to"><select className={inputCls} value={l.assigned_to ?? ""} onChange={(e) => patch({ assigned_to: e.target.value || null })}><option value="">Unassigned</option>{data.users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
            </div>
          </Card>
          <Card title="Notes">
            <form onSubmit={async (e) => { e.preventDefault(); if (!note.trim()) return; await api("POST", `/leads/${id}/notes`, { note }); setNote(""); reload(); }}>
              <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" placeholder="Add a note (stored encrypted)" />
              <div className="mt-2"><Btn type="submit" kind="primary" small>Add note</Btn></div>
            </form>
            <ul className="mt-4 space-y-3 text-sm">{data.notes.map((n: any) => <li key={n.id} className="border-l-2 border-line pl-3"><p className="whitespace-pre-wrap text-heading">{n.note}</p><p className="mt-0.5 text-xs text-muted">{n.author ?? "System"} · {fmtDate(n.created_at)}</p></li>)}</ul>
          </Card>
          <Card title="Emails">
            {data.emails.length ? <ul className="space-y-1.5 text-sm">{data.emails.map((m: any) => <li key={m.id} className="flex justify-between gap-2"><span>{m.kind}</span><span><Badge tone={m.status === "sent" ? "ok" : m.status === "failed" ? "risk" : "warn"}>{m.status}</Badge> <span className="text-xs text-muted">{fmtDate(m.sent_at ?? m.created_at)}</span></span></li>)}</ul> : <Empty>No emails.</Empty>}
          </Card>
        </div>
      </div>
    </Page>
  );
}

/* -------------------------------- Reports -------------------------------- */
export function Reports() {
  const { notify } = useAdmin();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useLoad(() => api("GET", `/reports?page=${page}`), [page]);
  return (
    <Page title="Reports" lead="Secure PDF download links. Tokens are stored hashed; links cannot be recovered, only revoked or reissued.">
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : !data.reports.length ? <Empty>No reports yet.</Empty> : (
        <>
          <Table head={["Assessment", "Company", "Created", "Expires", "Downloads", "State", ""]}>
            {data.reports.map((r: any) => (
              <tr key={r.id}>
                <Td><a className="text-cobalt" href={`#/assessments/${r.assessment_id}`}>{r.assessment_ref}</a></Td><Td>{r.company ?? "–"}</Td><Td>{fmtDate(r.created_at)}</Td><Td>{fmtDate(r.expires_at)}</Td>
                <Td>{r.download_count}{r.last_download_at && <span className="block text-xs text-muted">last {fmtDate(r.last_download_at)}</span>}</Td>
                <Td><Badge tone={r.state === "active" ? "ok" : r.state === "revoked" ? "risk" : "neutral"}>{r.state}</Badge></Td>
                <Td>{r.state === "active" && <Btn small kind="danger" onClick={async () => { await api("POST", `/reports/${r.id}/revoke`, {}); notify("Link revoked."); reload(); }}>Revoke</Btn>}</Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} size={data.size} total={data.total} onPage={setPage} />
        </>
      )}
    </Page>
  );
}

/* ------------------------------- Analytics ------------------------------- */
export function Analytics() {
  const [f, setF] = useState({ from: "", to: "", template: "", industry: "", company_size: "" });
  const { data: a, error, loading } = useLoad(() => api("GET", `/analytics${qs(f)}`), [JSON.stringify(f)]);
  return (
    <Page title="Analytics" lead="Calculated from database records. No third-party tracking.">
      <Filters>
        <Field label="From"><input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        <Field label="Template"><input className={inputCls} placeholder="slug" value={f.template} onChange={(e) => setF({ ...f, template: e.target.value })} /></Field>
        <Field label="Industry"><input className={inputCls} placeholder="e.g. manufacturing" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} /></Field>
        <Field label="Company size"><select className={inputCls} value={f.company_size} onChange={(e) => setF({ ...f, company_size: e.target.value })}><option value="">All</option>{["1-9", "10-49", "50-249", "250+", "unsure"].map((s) => <option key={s}>{s}</option>)}</select></Field>
      </Filters>
      {loading ? <Loading /> : error || !a ? <ErrorBox>{error}</ErrorBox> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Started" value={a.starts} sub={`${pct(a.completion_rate)} completed`} /><Kpi label="Completed" value={a.completed} sub={`Average score ${a.avg_score ?? "–"}`} />
            <Kpi label="Leads" value={a.leads} sub={`${pct(a.lead_rate)} of completions`} /><Kpi label="Converted" value={a.converted} sub={`${pct(a.conversion_rate)} of leads · ${a.consultations} consultations`} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Completions by assessment">{a.by_type.length ? <Bars rows={a.by_type.map((x: any) => ({ label: x.slug, value: x.n, text: `${x.n} · avg ${x.avg ?? "–"}` }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="Average score by domain (weakest first)">{a.categories.length ? <Bars max={100} rows={a.categories.map((x: any) => ({ label: x.key, value: x.avg ?? 0, text: `${x.avg}` }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="Maturity distribution">{a.by_classification.length ? <Bars rows={a.by_classification.map((x: any) => ({ label: x.key, value: x.n, text: String(x.n) }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="Most common critical gaps">{a.gaps.length ? <Bars rows={a.gaps.map((x: any) => ({ label: x.code, value: x.n, text: `${x.n} (${pct(x.pct)})` }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="By industry">{a.by_industry.length ? <Bars rows={a.by_industry.map((x: any) => ({ label: x.key, value: x.n, text: String(x.n) }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="By company size">{a.by_size.length ? <Bars rows={a.by_size.map((x: any) => ({ label: x.key, value: x.n, text: String(x.n) }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="Monthly trend">{a.trend.length ? <Bars rows={a.trend.map((x: any) => ({ label: x.month, value: x.n, text: `${x.n} · avg ${x.avg ?? "–"}` }))} /> : <Empty>No data</Empty>}</Card>
            <Card title="Where people stop (unfinished sessions by last step)">{!a.step_tracking ? <Empty>Step tracking is off (Settings).</Empty> : a.abandonment.length ? <Bars rows={a.abandonment.map((x: any) => ({ label: `Step ${x.step}`, value: x.n, text: String(x.n) }))} /> : <Empty>No abandoned sessions.</Empty>}</Card>
          </div>
        </>
      )}
    </Page>
  );
}
