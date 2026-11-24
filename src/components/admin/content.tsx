/* eslint-disable @typescript-eslint/no-explicit-any -- admin views render loosely-typed API JSON */
"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, GripVertical, Plus, Trash2, Upload } from "lucide-react";
import { api, can, fmtDate, L } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, Card, Empty, ErrorBox, Field, inputCls, JsonField, LInput, Loading, Page, Table, Td, useLoad, confirmDialog, promptDialog, Modal } from "./ui";

const statusTone = (s: string) => (s === "published" ? "ok" : s === "draft" ? "warn" : "neutral") as "ok" | "warn" | "neutral";
const err = (e: unknown) => (e as Error).message;

/* ------------------------------- Templates ------------------------------- */
export function Templates() {
  const { user, notify, go, query } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/templates"));
  const [slug, setSlug] = useState(""); const [name, setName] = useState("");
  const [creating, setCreating] = useState(!!query.get("new"));
  return (
    <Page title="Assessment templates" lead="Each template is a public assessment. Publishing creates an immutable version; completed results always keep the version they were taken with."
      actions={can(user, "content") && <Btn kind="primary" onClick={() => setCreating(true)}><Plus size={15} /> New assessment</Btn>}>
      {can(user, "content") && (
        <Modal open={creating} onClose={() => setCreating(false)} title="New assessment" description="Creates a draft. Add questions and publish when it is ready.">
          <form className="grid gap-4" onSubmit={async (e) => {
            e.preventDefault();
            try { const r = await api("POST", "/templates", { slug, data: { name: { en: name }, summary: { en: "" } } }); notify("Draft created."); go(`templates/${r.id}`); } catch (x) { notify(err(x), "risk"); }
          }}>
            <Field label="Name (English)"><input data-autofocus className={inputCls} required value={name} onChange={(e) => { setName(e.target.value); if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value)); }} /></Field>
            <Field label="URL slug" hint="Used in /cybersecurity-assessment/start/?t=slug"><input className={inputCls} required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(e) => setSlug(e.target.value)} /></Field>
            <div className="flex justify-end gap-2"><Btn onClick={() => setCreating(false)}>Cancel</Btn><Btn type="submit" kind="primary"><Plus size={15} /> Create draft</Btn></div>
          </form>
        </Modal>
      )}
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : (
        <Table head={["Assessment", "Status", "Version", "Questions", "Completions", "Updated", ""]}>
          {data.templates.map((t: any) => (
            <tr key={t.id}>
              <Td><a className="font-semibold text-cobalt" href={`#/templates/${t.id}`}>{L(t.data.name)}</a><br /><span className="text-xs text-muted">{t.slug}</span></Td>
              <Td><Badge tone={statusTone(t.status)}>{t.status}</Badge></Td><Td>{t.version ? `v${t.version}` : "–"}<span className="block text-xs text-muted">{fmtDate(t.published_at)}</span></Td>
              <Td>{t.questions}</Td><Td>{t.completions}</Td><Td>{fmtDate(t.updated_at)}</Td>
              <Td>{can(user, "content") && <Btn small onClick={async () => { const s = await promptDialog({ title: "Duplicate assessment", body: "The copy starts as a draft with the same questions and scoring.", confirmLabel: "Create copy", input: { label: "URL slug for the copy", value: `${t.slug}-copy` } }); if (!s) return; try { const r = await api("POST", `/templates/${t.id}/duplicate`, { slug: s }); notify("Copy created."); go(`templates/${r.id}`); } catch (x) { notify(err(x), "risk"); } }}><Copy size={13} /> Duplicate</Btn>}</Td>
            </tr>
          ))}
        </Table>
      )}
      {data && <Btn kind="ghost" onClick={reload}>Refresh</Btn>}
    </Page>
  );
}
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function TemplateDetail({ id }: { id: number }) {
  const { user, notify, go } = useAdmin();
  const { data, error, loading, reload, setData } = useLoad(() => api("GET", `/templates/${id}`), [id]);
  const bank = useLoad(() => api("GET", "/questions"));
  const [preview, setPreview] = useState<any>(null);
  const [add, setAdd] = useState("");
  const [dragI, setDragI] = useState<number | null>(null);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox>{error}</ErrorBox>;
  const t = data.template; const d = t.data;
  const edit = can(user, "content"); const pub = can(user, "publish");
  const setD = (patch: any) => setData({ ...data, template: { ...t, data: { ...d, ...patch } } });
  const mapped: any[] = data.questions;
  const setMapped = (qs: any[]) => setData({ ...data, questions: qs });
  const move = (i: number, dir: number) => { const q = [...mapped]; const [x] = q.splice(i, 1); q.splice(i + dir, 0, x); setMapped(q); };

  const saveMeta = async () => { try { await api("PUT", `/templates/${id}`, { data: d }); notify("Details saved. Publish to make them live."); reload(); } catch (x) { notify(err(x), "risk"); } };
  const saveMapping = async () => {
    try { await api("PUT", `/templates/${id}/questions`, { questions: mapped.map((q) => ({ code: q.code, overrides: q.overrides })) }); notify("Questions saved. Publish to make them live."); reload(); } catch (x) { notify(err(x), "risk"); }
  };
  const evaluates = (d.evaluates ?? []) as any[];

  return (
    <Page title={L(d.name) || t.slug} lead={<>/{t.slug} · <Badge tone={statusTone(t.status)}>{t.status}</Badge> {data.versions[0] && `· live version v${data.versions[0].version}`}</>}
      actions={<>
        <Btn onClick={async () => setPreview(await api("GET", `/templates/${id}/preview?locale=en`))}><Eye size={15} /> Preview</Btn>
        {pub && <Btn kind="primary" onClick={async () => { try { const r = await api("POST", `/templates/${id}/publish`, {}); notify(r.changed ? `Published as version ${r.version}.` : "No changes since the last version; it is published."); reload(); } catch (x) { notify(err(x), "risk"); } }}><Upload size={15} /> Publish</Btn>}
        {pub && t.status === "published" && <Btn onClick={async () => { await api("POST", `/templates/${id}/unpublish`, {}); notify("Unpublished. Existing results remain available."); reload(); }}>Unpublish</Btn>}
        {pub && t.status !== "archived" && <Btn onClick={async () => { await api("POST", `/templates/${id}/archive`, {}); notify("Archived."); reload(); }}>Archive</Btn>}
        {can(user, "delete") && <Btn kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Delete this assessment type? Completed results keep their snapshot.", danger: true, confirmLabel: "Confirm" }))) return; await api("DELETE", `/templates/${id}`); go("templates"); }}><Trash2 size={15} aria-hidden="true" /> Delete</Btn>}
      </>}>
      {data.publish_errors.length > 0 && <div className="form-error mb-5 rounded-xl"><strong>Validation: cannot be published yet</strong><ul className="mt-1 list-disc pl-5">{data.publish_errors.map((e: string) => <li key={e}>{e}</li>)}</ul></div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card title="Details and SEO" actions={edit && <Btn small kind="primary" onClick={saveMeta}>Save details</Btn>}>
            <div className="grid gap-4">
              <LInput label="Name" value={d.name} onChange={(v) => setD({ name: v })} />
              <LInput label="Summary" value={d.summary} onChange={(v) => setD({ summary: v })} area />
              <LInput label="Who it is for" value={d.audience} onChange={(v) => setD({ audience: v })} />
              <LInput label="SEO title" value={d.seo?.title} onChange={(v) => setD({ seo: { ...d.seo, title: v } })} />
              <LInput label="SEO description" value={d.seo?.description} onChange={(v) => setD({ seo: { ...d.seo, description: v } })} area />
              <Field label="What it evaluates" hint="One item per line: English | Dutch">
                <textarea className={inputCls} rows={4} value={evaluates.map((e) => `${e.en ?? ""} | ${e.nl ?? ""}`).join("\n")}
                  onChange={(e) => setD({ evaluates: e.target.value.split("\n").filter((x) => x.trim()).map((x) => { const [en, nl] = x.split("|").map((s) => s.trim()); return { en, nl }; }) })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="“Not sure” scoring"><select className={inputCls} value={d.settings?.unsure_policy ?? ""} onChange={(e) => setD({ settings: { ...d.settings, unsure_policy: e.target.value || undefined } })}><option value="">Global default</option><option value="zero">Counts as 0</option><option value="exclude">Excluded</option></select></Field>
                <Field label="Strength threshold"><input type="number" min={0} max={100} className={inputCls} value={d.settings?.strength_threshold ?? ""} placeholder="Global" onChange={(e) => setD({ settings: { ...d.settings, strength_threshold: e.target.value === "" ? undefined : Number(e.target.value) } })} /></Field>
                <Field label="Max recommendations"><input type="number" min={1} max={30} className={inputCls} value={d.settings?.max_recommendations ?? ""} placeholder="Global" onChange={(e) => setD({ settings: { ...d.settings, max_recommendations: e.target.value === "" ? undefined : Number(e.target.value) } })} /></Field>
              </div>
              <Field label="Display order"><input type="number" className={`${inputCls} max-w-[8rem]`} value={d.sort ?? ""} onChange={(e) => setD({ sort: Number(e.target.value) })} /></Field>
            </div>
          </Card>

          <Card title={`Questions (${mapped.length})`} actions={edit && <Btn small kind="primary" onClick={saveMapping}>Save questions</Btn>}>
            <p className="mb-3 text-xs text-muted">Drag to reorder, or use the arrow buttons. Shown grouped by category in category order; order within a category follows this list. Conditions may only refer to earlier questions.</p>
            <ol className="divide-y divide-line">
              {mapped.map((q, i) => (
                <li key={q.code} className={`flex flex-wrap items-center gap-3 py-2 text-sm ${dragI === i ? "opacity-50" : ""}`} draggable={edit}
                  onDragStart={() => setDragI(i)} onDragEnd={() => setDragI(null)} onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragI === null || dragI === i) return; const qs = [...mapped]; const [x] = qs.splice(dragI, 1); qs.splice(i, 0, x); setMapped(qs); setDragI(null); }}>
                  {edit && <GripVertical size={14} className="cursor-grab text-muted/60" aria-hidden="true" />}
                  <span className="tnum w-6 text-xs text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="font-semibold text-heading">{L(q.data.title)}</span><span className="block text-xs text-muted">{q.code} · {q.data.category} · {q.data.type}{q.data.condition ? " · conditional" : ""}{q.data.critical ? " · critical" : ""}{q.status !== "published" ? ` · ${q.status}` : ""}</span></span>
                  {edit && <>
                    <label className="flex items-center gap-1 text-xs">Weight <input type="number" step="0.1" min="0.1" max="10" className={`${inputCls} w-20 py-1`} placeholder={String(q.data.weight ?? 1)} value={q.overrides?.weight ?? ""}
                      onChange={(e) => { const qs = [...mapped]; qs[i] = { ...q, overrides: { ...q.overrides, weight: e.target.value === "" ? undefined : Number(e.target.value) } }; setMapped(qs); }} /></label>
                    <label className="flex items-center gap-1 text-xs"><select aria-label={`Required: ${q.code}`} className={`${inputCls} w-28 py-1`} value={q.overrides?.required === undefined ? "" : q.overrides.required ? "1" : "0"}
                      onChange={(e) => { const qs = [...mapped]; qs[i] = { ...q, overrides: { ...q.overrides, required: e.target.value === "" ? undefined : e.target.value === "1" } }; setMapped(qs); }}>
                      <option value="">Default</option><option value="1">Required</option><option value="0">Optional</option></select></label>
                    <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={15} /></button>
                    <button aria-label="Move down" disabled={i === mapped.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={15} /></button>
                    <button aria-label="Remove" onClick={() => setMapped(mapped.filter((_, j) => j !== i))} className="p-1 text-risk-fg"><Trash2 size={15} /></button>
                  </>}
                </li>
              ))}
            </ol>
            {edit && bank.data && (
              <div className="mt-4 flex gap-2">
                <select className={inputCls} value={add} onChange={(e) => setAdd(e.target.value)} aria-label="Add question from the bank">
                  <option value="">Add a question from the bank…</option>
                  {bank.data.questions.filter((q: any) => !mapped.some((m) => m.code === q.code)).map((q: any) => <option key={q.code} value={q.code}>{q.data.category} · {q.code} · {L(q.data.title).slice(0, 70)}</option>)}
                </select>
                <Btn onClick={() => { const q = bank.data.questions.find((x: any) => x.code === add); if (q) { setMapped([...mapped, { ...q, overrides: {} }]); setAdd(""); } }}><Plus size={15} /> Add</Btn>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Versions">
            {data.versions.length ? <ul className="space-y-2 text-sm">{data.versions.map((v: any) => <li key={v.id} className="flex justify-between"><span>v{v.version}</span><span className="text-xs text-muted">{fmtDate(v.published_at)} · {v.checksum.slice(0, 8)}</span></li>)}</ul> : <Empty>Never published.</Empty>}
          </Card>
          <Card title="Links">
            <ul className="space-y-1.5 text-sm">
              <li><a className="text-cobalt" target="_blank" rel="noopener" href={`/cybersecurity-assessment/start/?t=${t.slug}`}>Run (English)</a></li>
              <li><a className="text-cobalt" target="_blank" rel="noopener" href={`/nl/cybersecurity-assessment/start/?t=${t.slug}`}>Run (Dutch)</a></li>
            </ul>
            <p className="mt-3 text-xs text-muted">New assessments appear on the assessment hub immediately after publishing. A dedicated SEO landing page is added at the next website build.</p>
          </Card>
        </div>
      </div>

      {preview && (
        <Modal open onClose={() => setPreview(null)} size="lg" title={`Participant preview: ${preview.payload.name}`} description="What participants see, including draft questions. Nothing is saved.">
          <div>
            <div className="flex gap-2"><Btn small onClick={async () => setPreview(await api("GET", `/templates/${id}/preview?locale=en`))}>English</Btn><Btn small onClick={async () => setPreview(await api("GET", `/templates/${id}/preview?locale=nl`))}>Dutch</Btn></div>
            {preview.errors.length > 0 && <ErrorBox>{preview.errors.join("; ")}</ErrorBox>}
            <p className="mt-3 text-sm text-muted">{preview.payload.summary} · about {preview.payload.minutes} min · includes draft questions</p>
            {preview.payload.categories.map((c: any) => (
              <div key={c.key} className="mt-5"><h3 className="font-semibold text-heading">{c.name}</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">{preview.payload.questions.filter((q: any) => q.category === c.key).map((q: any) => (
                  <li key={q.code}>{q.title} <span className="text-xs text-muted">({q.type}{q.condition ? ", conditional" : ""}{q.allow_unsure ? ", not sure" : ""}{q.allow_na ? ", n/a" : ""})</span>
                    {q.options.length > 0 && q.type !== "maturity" && <span className="block text-xs text-muted">{q.options.map((o: any) => o.label).join(" · ")}</span>}</li>
                ))}</ol>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </Page>
  );
}

/* ------------------------------ Question bank ------------------------------ */
const QTYPES = ["maturity", "yes_no", "single", "multi", "number"];
export function Questions() {
  const { user, notify, query } = useAdmin();
  const [f, setF] = useState({ q: query.get("q") ?? "", category: "", status: "" });
  const { data, error, loading, reload } = useLoad(() => api("GET", `/questions?${new URLSearchParams(Object.entries(f).filter(([, v]) => v))}`), [JSON.stringify(f)]);
  const cats = useLoad(() => api("GET", "/categories"));
  const [editing, setEditing] = useState<any>(null);
  return (
    <Page title="Question bank" lead="Questions are shared across templates. Edits take effect when a template using them is published again."
      actions={can(user, "content") && <Btn kind="primary" onClick={() => setEditing({ isNew: true, code: "", status: "draft", data: { type: "maturity", category: cats.data?.categories[1]?.key ?? "", title: { en: "", nl: "" }, allow_unsure: true, weight: 1, risk: "medium" } })}><Plus size={15} /> New question</Btn>}>
      <div className="mb-4 grid gap-3 rounded-xl border border-line bg-surface p-3 shadow-[var(--a-shadow-card)] sm:grid-cols-3">
        <input type="search" className={inputCls} placeholder="Search code or text" aria-label="Search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select className={inputCls} aria-label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}><option value="">All categories</option>{cats.data?.categories.map((c: any) => <option key={c.key} value={c.key}>{L(c.data.name)}</option>)}</select>
        <select className={inputCls} aria-label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">Active (published + draft)</option><option>published</option><option>draft</option><option>archived</option></select>
      </div>
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : !data.questions.length ? <Empty>No questions found.</Empty> : (
        <Table head={["Question", "Category", "Type", "Weight", "Flags", "Used in", ""]}>
          {data.questions.map((q: any) => (
            <tr key={q.id}>
              <Td><span className="font-semibold text-heading">{L(q.data.title)}</span><span className="block text-xs text-muted">{q.code}{!q.data.title?.nl && " · missing Dutch"}</span></Td>
              <Td>{q.data.category}</Td><Td>{q.data.type}</Td><Td>{q.data.scored === false ? "unscored" : q.data.weight ?? 1}</Td>
              <Td className="space-x-1">{q.status !== "published" && <Badge tone="warn">{q.status}</Badge>}{q.data.critical && <Badge tone="risk">critical</Badge>}{q.data.condition && <Badge>conditional</Badge>}{q.data.profile_key && <Badge tone="brand">profile</Badge>}</Td>
              <Td>{q.used}</Td>
              <Td>{can(user, "content") && <Btn small onClick={() => setEditing({ ...q })}>Edit</Btn>}</Td>
            </tr>
          ))}
        </Table>
      )}
      {editing && <QuestionEditor q={editing} cats={cats.data?.categories ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); notify("Question saved."); }} canDelete={can(user, "delete")} />}
    </Page>
  );
}

function QuestionEditor({ q, cats, onClose, onSaved, canDelete }: { q: any; cats: any[]; onClose: () => void; onSaved: () => void; canDelete: boolean }) {
  const [code, setCode] = useState(q.code); const [status, setStatus] = useState(q.status);
  const [d, setD] = useState<any>(q.data);
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: string, v: unknown) => setD((x: any) => { const n = { ...x }; if (v === undefined || v === "") delete n[k]; else n[k] = v; return n; });
  const json = (k: string) => (v: unknown, ok: boolean) => { setBad((b) => ({ ...b, [k]: !ok })); if (ok) set(k, v); };
  const save = async () => {
    if (Object.values(bad).some(Boolean)) { setMsg("Fix the invalid JSON fields first."); return; }
    try { if (q.isNew) await api("POST", "/questions", { code, status, data: d }); else await api("PUT", `/questions/${q.id}`, { status, data: d }); onSaved(); } catch (e) { setMsg(err(e)); }
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-label="Edit question">
      <div className="mx-auto max-w-3xl space-y-4 rounded-lg bg-surface p-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-heading">{q.isNew ? "New question" : `Edit ${q.code}`}</h2><Btn small onClick={onClose}>Close</Btn></div>
        {!q.isNew && q.used > 0 && <p className="rounded-md bg-warn-bg p-3 text-sm text-warn-fg">Used in {q.used} template(s). Changes apply after republishing; completed results are unaffected.</p>}
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Code"><input className={inputCls} disabled={!q.isNew} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Category"><select className={inputCls} value={d.category} onChange={(e) => set("category", e.target.value)}>{cats.map((c) => <option key={c.key} value={c.key}>{L(c.data.name)}</option>)}</select></Field>
          <Field label="Type"><select className={inputCls} value={d.type} onChange={(e) => set("type", e.target.value)}>{QTYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Status"><select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option>published</option><option>draft</option><option>archived</option></select></Field>
        </div>
        <LInput label="Question" value={d.title} onChange={(v) => set("title", v)} area />
        <LInput label="Help text (optional)" value={d.description} onChange={(v) => set("description", v.en || v.nl ? v : undefined)} />
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Weight"><input type="number" step="0.1" min="0.1" max="10" className={inputCls} value={d.weight ?? 1} onChange={(e) => set("weight", Number(e.target.value))} /></Field>
          <Field label="Risk"><select className={inputCls} value={d.risk ?? "medium"} onChange={(e) => set("risk", e.target.value)}><option>critical</option><option>high</option><option>medium</option><option>low</option></select></Field>
          <Field label="Profile field"><select className={inputCls} value={d.profile_key ?? ""} onChange={(e) => set("profile_key", e.target.value)}><option value="">None</option><option>company_size</option><option>industry</option><option>country</option><option>employees</option></select></Field>
          <Field label="Recommendation rules" hint="Comma-separated codes"><input className={inputCls} value={(d.recommendations ?? []).join(", ")} onChange={(e) => set("recommendations", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {[["required", "Required", true], ["scored", "Scored", true], ["allow_unsure", "Allow “Not sure”", false], ["allow_na", "Allow “Not applicable”", false]].map(([k, label, def]) => (
            <label key={k as string} className="flex items-center gap-2"><input type="checkbox" className="check" checked={d[k as string] ?? def} onChange={(e) => set(k as string, e.target.checked)} /> {label as string}</label>
          ))}
        </div>
        {(d.type === "single" || d.type === "multi") && <JsonField label="Options" rows={8} value={d.options} onChange={json("options")} hint='[{"value":"a","score":4,"label":{"en":"…","nl":"…"}}] · score 0–4, or null for an unscored option' />}
        {d.type === "number" && <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Min"><input type="number" className={inputCls} value={d.min ?? ""} onChange={(e) => set("min", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
          <Field label="Max"><input type="number" className={inputCls} value={d.max ?? ""} onChange={(e) => set("max", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
          <JsonField label="Score ranges" rows={3} value={d.ranges} onChange={json("ranges")} hint='[{"min":0,"max":10,"score":0}]' />
        </div>}
        <JsonField label="Condition (optional)" value={d.condition} onChange={json("condition")} hint='{"mode":"all","rules":[{"q":"p_cloud","op":"in","value":["yes"]}]} · ops: in, not_in, gte, lte, answered, not_answered' />
        <JsonField label="Critical gap (optional)" rows={4} value={d.critical} onChange={json("critical")} hint='{"max_score":1,"unsure":true,"finding":{"en":"…","nl":"…"}}' />
        {msg && <ErrorBox>{msg}</ErrorBox>}
        <div className="flex justify-between gap-2">
          {!q.isNew && canDelete ? <Btn kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Delete this question? If it is used in templates it will be archived and removed from them instead.", danger: true, confirmLabel: "Confirm" }))) return; try { await api("DELETE", `/questions/${q.id}`); onSaved(); } catch (e) { setMsg(err(e)); } }}>Delete</Btn> : <span />}
          <Btn kind="primary" onClick={save}>Save question</Btn>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Categories ------------------------------- */
export function Categories() {
  const { user, notify } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/categories"));
  const [editing, setEditing] = useState<any>(null);
  const save = async () => {
    try { if (editing.isNew) await api("POST", "/categories", { key: editing.key, data: editing.data }); else await api("PUT", `/categories/${editing.id}`, { data: editing.data }); setEditing(null); reload(); notify("Category saved."); } catch (e) { notify(err(e), "risk"); }
  };
  return (
    <Page title="Categories" lead="Each category is a step in the assessment. Category weight affects the overall score."
      actions={can(user, "content") && <Btn kind="primary" onClick={() => setEditing({ isNew: true, key: "", data: { name: { en: "" }, weight: 1, sort: 10, scored: true } })}><Plus size={15} /> New category</Btn>}>
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : (
        <Table head={["Order", "Category", "Weight", "Scored", "Questions", ""]}>
          {data.categories.map((c: any) => (
            <tr key={c.id}><Td>{c.data.sort}</Td><Td><span className="font-semibold text-heading">{L(c.data.name)}</span><span className="block text-xs text-muted">{c.key} · {c.data.name?.nl}</span></Td><Td>{c.data.weight}</Td><Td>{c.data.scored === false ? "No" : "Yes"}</Td><Td>{c.questions}</Td>
              <Td className="space-x-1">{can(user, "content") && <Btn small onClick={() => setEditing({ ...c })}>Edit</Btn>}{can(user, "delete") && <Btn small kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Delete category?", danger: true, confirmLabel: "Confirm" }))) return; try { await api("DELETE", `/categories/${c.id}`); reload(); } catch (e) { notify(err(e), "risk"); } }}>Delete</Btn>}</Td></tr>
          ))}
        </Table>
      )}
      {editing && (
        <Card title={editing.isNew ? "New category" : `Edit ${editing.key}`} className="mt-6">
          <div className="grid gap-3">
            {editing.isNew && <Field label="Key"><input className={inputCls} value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} /></Field>}
            <LInput label="Name" value={editing.data.name} onChange={(v) => setEditing({ ...editing, data: { ...editing.data, name: v } })} />
            <LInput label="Description" value={editing.data.description} onChange={(v) => setEditing({ ...editing, data: { ...editing.data, description: v } })} area />
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Weight"><input type="number" step="0.1" min="0" max="10" className={inputCls} value={editing.data.weight} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, weight: Number(e.target.value) } })} /></Field>
              <Field label="Order"><input type="number" className={inputCls} value={editing.data.sort} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, sort: Number(e.target.value) } })} /></Field>
              <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" className="check" checked={editing.data.scored !== false} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, scored: e.target.checked } })} /> Scored</label>
            </div>
            <div className="flex gap-2"><Btn kind="primary" onClick={save}>Save</Btn><Btn onClick={() => setEditing(null)}>Cancel</Btn></div>
          </div>
        </Card>
      )}
    </Page>
  );
}

/* -------------------------------- Scoring -------------------------------- */
export function Scoring() {
  const { user, notify } = useAdmin();
  const { data, error, loading, setData, reload } = useLoad(() => api("GET", "/scoring"));
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox>{error}</ErrorBox>;
  const edit = can(user, "settings");
  const th = data.thresholds as any[];
  const setTh = (i: number, patch: any) => setData({ ...data, thresholds: th.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  return (
    <Page title="Scoring" lead="Scores are 0–4 per answer, normalised to 0–100 with question and category weights. “Not applicable” is always excluded. Changes apply to templates when they are next published.">
      <Card title="Maturity classifications" actions={edit && <Btn small onClick={() => setData({ ...data, thresholds: [...th, { min: 100, key: "new", label: { en: "New", nl: "" } }] })}><Plus size={13} /> Add</Btn>}>
        <Table head={["From score", "Key", "Label (EN)", "Label (NL)", ""]}>
          {th.map((t, i) => (
            <tr key={i}>
              <Td><input type="number" min={0} max={100} disabled={!edit} className={`${inputCls} w-24`} value={t.min} onChange={(e) => setTh(i, { min: Number(e.target.value) })} aria-label="From score" /></Td>
              <Td><input className={inputCls} disabled={!edit} value={t.key} onChange={(e) => setTh(i, { key: e.target.value })} aria-label="Key" /></Td>
              <Td><input className={inputCls} disabled={!edit} value={t.label.en} onChange={(e) => setTh(i, { label: { ...t.label, en: e.target.value } })} aria-label="English label" /></Td>
              <Td><input className={inputCls} disabled={!edit} value={t.label.nl ?? ""} onChange={(e) => setTh(i, { label: { ...t.label, nl: e.target.value } })} aria-label="Dutch label" /></Td>
              <Td>{edit && th.length > 2 && <button aria-label="Remove" className="text-risk-fg" onClick={() => setData({ ...data, thresholds: th.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Defaults" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="“Not sure” answers"><select disabled={!edit} className={inputCls} value={data.unsure_policy} onChange={(e) => setData({ ...data, unsure_policy: e.target.value })}><option value="zero">Count as 0 (conservative)</option><option value="exclude">Exclude from score</option></select></Field>
          <Field label="Strength threshold" hint="Domains at or above this score (with no “Not sure”) are shown as strengths."><input disabled={!edit} type="number" min={0} max={100} className={inputCls} value={data.strength_threshold} onChange={(e) => setData({ ...data, strength_threshold: Number(e.target.value) })} /></Field>
          <Field label="Max recommendations"><input disabled={!edit} type="number" min={1} max={30} className={inputCls} value={data.max_recommendations} onChange={(e) => setData({ ...data, max_recommendations: Number(e.target.value) })} /></Field>
        </div>
      </Card>
      {edit && <div className="mt-6 flex gap-2"><Btn kind="primary" onClick={async () => { try { await api("PUT", "/scoring", data); notify("Scoring saved. Republish templates to apply."); reload(); } catch (e) { notify(err(e), "risk"); } }}>Save scoring</Btn></div>}
    </Page>
  );
}

/* --------------------------- Recommendation rules --------------------------- */
export function Rules() {
  const { user, notify } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/rules"));
  const [editing, setEditing] = useState<any>(null);
  const [bad, setBad] = useState(false);
  const save = async () => {
    if (bad) return notify("Fix the trigger JSON first.", "risk");
    try { if (editing.isNew) await api("POST", "/rules", { code: editing.code, active: editing.active, data: editing.data }); else await api("PUT", `/rules/${editing.id}`, { active: editing.active, data: editing.data }); setEditing(null); reload(); notify("Rule saved. Republish templates to apply."); } catch (e) { notify(err(e), "risk"); }
  };
  const D = editing?.data; const setD = (p: any) => setEditing({ ...editing, data: { ...D, ...p } });
  return (
    <Page title="Recommendation rules" lead="Rules fire only from the participant's own answers. Trigger types: score_lte, answer_in, unsure, gap, category_lt, mapped."
      actions={can(user, "content") && <Btn kind="primary" onClick={() => setEditing({ isNew: true, code: "", active: true, data: { priority: "medium", category: "governance", service: null, title: { en: "" }, description: { en: "" }, templates: [], trigger: { mode: "any", conditions: [{ type: "mapped", max_score: 1 }] } } })}><Plus size={15} /> New rule</Btn>}>
      {editing && (
        <Card key={editing.id ?? "new"} title={editing.isNew ? "New rule" : `Edit ${editing.code}`} className="mb-6">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Code"><input className={inputCls} disabled={!editing.isNew} value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></Field>
              <Field label="Priority"><select className={inputCls} value={D.priority} onChange={(e) => setD({ priority: e.target.value })}><option>critical</option><option>high</option><option>medium</option><option>low</option></select></Field>
              <Field label="Category"><input className={inputCls} value={D.category} onChange={(e) => setD({ category: e.target.value })} /></Field>
              <Field label="Service"><select className={inputCls} value={D.service ?? ""} onChange={(e) => setD({ service: e.target.value || null })}><option value="">None</option>{Object.keys(data?.services ?? {}).map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            <LInput label="Title" value={D.title} onChange={(v) => setD({ title: v })} />
            <LInput label="Description" value={D.description} onChange={(v) => setD({ description: v })} area />
            <LInput label="Business impact" value={D.impact} onChange={(v) => setD({ impact: v })} area />
            <LInput label="Remediation guidance" value={D.remediation} onChange={(v) => setD({ remediation: v })} area />
            <LInput label="Suggested timeframe" value={D.timeframe} onChange={(v) => setD({ timeframe: v })} />
            <Field label="Only for templates" hint="Comma-separated slugs; empty = all templates"><input className={inputCls} value={(D.templates ?? []).join(", ")} onChange={(e) => setD({ templates: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
            <JsonField label="Trigger" value={D.trigger} onChange={(v, ok) => { setBad(!ok); if (ok) setD({ trigger: v }); }} hint='{"mode":"any","conditions":[{"type":"gap","q":"iam_mfa"},{"type":"category_lt","category":"awareness","value":50}]}' />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="check" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
            <div className="flex gap-2"><Btn kind="primary" onClick={save}>Save rule</Btn><Btn onClick={() => setEditing(null)}>Cancel</Btn>
              {!editing.isNew && can(user, "delete") && <Btn kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Delete rule?", danger: true, confirmLabel: "Confirm" }))) return; await api("DELETE", `/rules/${editing.id}`); setEditing(null); reload(); }}>Delete</Btn>}</div>
          </div>
        </Card>
      )}
      {loading ? <Loading /> : error ? <ErrorBox>{error}</ErrorBox> : (
        <Table head={["Rule", "Priority", "Category", "Service", "Triggers", ""]}>
          {data.rules.map((r: any) => (
            <tr key={r.id} className={r.active ? "" : "opacity-60"}>
              <Td><span className="font-semibold text-heading">{L(r.data.title)}</span><span className="block text-xs text-muted">{r.code}{!r.active && " · inactive"}{!r.data.title?.nl && " · missing Dutch"}</span></Td>
              <Td><Badge tone={r.data.priority === "critical" ? "risk" : r.data.priority === "high" ? "warn" : "neutral"}>{r.data.priority}</Badge></Td><Td>{r.data.category}</Td><Td className="text-xs">{r.data.service ?? "–"}</Td>
              <Td className="text-xs">{r.data.trigger.conditions.map((c: any) => c.type + (c.q ? `:${c.q}` : c.category ? `:${c.category}` : "")).join(", ")}</Td>
              <Td>{can(user, "content") && <Btn small onClick={() => setEditing({ ...r })}>Edit</Btn>}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Page>
  );
}
