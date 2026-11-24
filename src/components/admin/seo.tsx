/* eslint-disable @typescript-eslint/no-explicit-any -- SEO views walk arbitrary content JSON */
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileSearch, Globe, Languages, Link2Off, Pencil, Plus, Signpost, Trash2, XCircle } from "lucide-react";
import { api, can, fmtDate, fmtDay, timeAgo } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, EmptyState, ErrorBox, Field, FilterBar, inputCls, Loading, Modal, Notice, Page, SearchInput, Tabs, confirmDialog, useLoad } from "./ui";
import { DataTable, type Column } from "./datatable";
import { brokenLinks, knownPaths, seoIssues, textFields, useSiteContent, type ContentItem } from "./sitecontent";

const SITE = "https://blazekonzult.nl";
const editHref = (it: ContentItem) => it.kind === "article" ? `#/articles/${it.loc === "nl" ? "nl:" : ""}${it.baseKey.slice(8)}` : `#/website/${encodeURIComponent(it.storeKey)}`;

/** A typical search-result listing (an approximation, not Google data). */
export function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  const t = title.length > 60 ? title.slice(0, 58).trimEnd() + "…" : title;
  const d = description.length > 158 ? description.slice(0, 155).trimEnd() + "…" : description;
  return (
    <div className="rounded-xl border border-line bg-surface p-4" aria-label="Search result preview">
      <div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-surface-2"><Globe size={14} className="text-muted" aria-hidden="true" /></span>
        <span className="min-w-0 leading-tight"><span className="block text-sm text-heading">BlazeKonzult</span><span className="block truncate text-xs text-muted">{SITE}{path}</span></span></div>
      <p className="mt-2 text-[1.125rem] leading-snug text-cobalt">{t || <span className="italic text-muted">No title</span>}</p>
      <p className="mt-1 text-sm leading-relaxed text-body">{d || <span className="italic text-muted">No description: search engines will pick text from the page.</span>}</p>
    </div>
  );
}

function SeoEditor({ item, onClose, onSaved }: { item: ContentItem; onClose: () => void; onSaved: () => void }) {
  const { notify, user } = useAdmin();
  const [title, setTitle] = useState(item.seo.title);
  const [desc, setDesc] = useState(item.seo.description);
  const [busy, setBusy] = useState(false);
  const fallbackTitle = item.kind === "article" ? item.data.title : "";
  const fallbackDesc = item.kind === "article" ? item.data.excerpt : "";
  return (
    <Modal open onClose={onClose} size="lg" title={`SEO: ${item.label}`} description={`${item.loc === "nl" ? "Dutch" : "English"} · ${item.path}`}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" busy={busy} disabled={!can(user, "content")} onClick={async () => {
        setBusy(true);
        try { await api("PUT", `/content/${encodeURIComponent(item.storeKey)}`, { data: { ...item.data, seo: { ...(item.data.seo ?? {}), title, description: desc } } }); notify("SEO saved. The change is live."); onSaved(); onClose(); }
        catch (e) { notify((e as Error).message, "risk"); } setBusy(false);
      }}>Save and publish</Btn></>}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Page title" hint={<span className="tnum">{title.length} characters · about 50–60 is ideal{!title && fallbackTitle ? ` · empty uses the article title` : ""}</span>}><input data-autofocus className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></Field>
          <Field label="Meta description" hint={<span className="tnum">{desc.length} characters · about 120–155 is ideal{!desc && fallbackDesc ? " · empty uses the excerpt" : ""}</span>}><textarea className={inputCls} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} /></Field>
          <p className="text-xs text-muted">The canonical address and hreflang links (English/Dutch) are generated automatically from the page address.</p>
        </div>
        <div><p className="mb-2 text-[0.8125rem] font-medium text-heading">Preview</p><SerpPreview title={title || fallbackTitle} description={desc || fallbackDesc} path={item.path} /><p className="mt-2 text-xs text-muted">An approximation of a typical search listing. Search engines may show different text.</p></div>
      </div>
    </Modal>
  );
}

export function SeoOverview() {
  const site = useSiteContent();
  const media = useLoad(() => api("GET", "/media"));
  const [loc, setLoc] = useState<"en" | "nl">("en");
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "issues">("issues");
  const [edit, setEdit] = useState<ContentItem | null>(null);
  const [sitemap, setSitemap] = useState<number | null | "error">(null);
  useEffect(() => { fetch("/sitemap.xml").then((r) => (r.ok ? r.text() : Promise.reject())).then((t) => setSitemap((t.match(/<url>/g) ?? []).length)).catch(() => setSitemap("error")); }, []);
  const rows = useMemo(() => {
    if (!site.items) return null;
    const known = knownPaths(site.items);
    return site.items.filter((x) => x.kind !== "site").map((it) => ({ ...it, issues: seoIssues(it, site.items!), broken: brokenLinks(it, known) }));
  }, [site.items]);
  if (site.error) return <ErrorBox onRetry={site.reload}>{site.error}</ErrorBox>;
  if (!rows) return <Loading />;
  const inLoc = rows.filter((r) => r.loc === loc);
  const published = inLoc.filter((r) => r.status === "published");
  const missingT = published.filter((r) => r.issues.some((i) => i.code === "title_missing")).length;
  const missingD = published.filter((r) => r.issues.some((i) => i.code === "desc_missing")).length;
  const dup = published.filter((r) => r.issues.some((i) => i.code.endsWith("_dup"))).length;
  const broken = inLoc.reduce((a, r) => a + r.broken.length, 0);
  const altMissing = (media.data?.media ?? []).filter((m: any) => m.used_in.length && !m.alt).length + published.filter((r) => r.issues.some((i) => i.code === "alt_missing")).length;
  const healthy = published.filter((r) => !r.issues.some((i) => i.severity !== "low") && !r.broken.length).length;
  const score = published.length ? Math.round((100 * healthy) / published.length) : 0;
  const shown = inLoc.filter((r) => (only === "all" || r.issues.length || r.broken.length) && (!q || `${r.label} ${r.path}`.toLowerCase().includes(q.toLowerCase())));
  const tile = (label: string, v: number | string, good: boolean, hint?: string) => (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-[var(--a-shadow-card)]"><p className="flex items-center gap-1.5 text-[0.8125rem] text-muted">{good ? <CheckCircle2 size={14} className="text-ok-fg" aria-hidden="true" /> : <AlertTriangle size={14} className="text-warn-fg" aria-hidden="true" />}{label}</p><p className="tnum mt-1 text-2xl font-semibold text-heading">{v}</p>{hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}</div>
  );
  const columns: Column<any>[] = [
    { key: "page", header: "Page", mobile: "title", render: (r) => <div className="min-w-0"><a href={editHref(r)} className="font-medium text-heading hover:text-brand hover:underline">{r.label}</a><span className="block truncate text-xs text-muted">{r.path}</span></div> },
    { key: "title", header: "Search title", hideable: true, render: (r) => <span className="block max-w-[18rem] truncate" title={r.seo.title}>{r.seo.title || <span className="italic text-muted">{r.seo.titleSource === "fallback" ? "Uses page title" : "Missing"}</span>}</span> },
    { key: "index", header: "Indexing", hideable: true, render: (r) => r.status === "draft" ? <Badge>Not indexed (draft)</Badge> : <Badge tone="ok" dot>Indexable</Badge> },
    { key: "issues", header: "Checks", render: (r) => !r.issues.length && !r.broken.length ? <Badge tone="ok" dot>Good</Badge> : <ul className="space-y-0.5 text-xs">{r.issues.map((i: any) => <li key={i.code} className={`flex items-center gap-1.5 ${i.severity === "high" ? "text-risk-fg" : i.severity === "medium" ? "text-warn-fg" : "text-muted"}`}>{i.severity === "high" ? <XCircle size={12} aria-hidden="true" /> : <AlertTriangle size={12} aria-hidden="true" />}{i.text}</li>)}{r.broken.map((b: string) => <li key={b} className="flex items-center gap-1.5 text-risk-fg"><Link2Off size={12} aria-hidden="true" />Link to missing page {b}</li>)}</ul> },
    { key: "actions", header: "", render: (r) => <Btn small onClick={() => setEdit(r)}><Pencil size={13} /> Edit SEO</Btn> },
  ];
  return (
    <Page title="SEO overview" lead="Internal checks of what search engines will see on each page. These are not Google Search Console data: rankings, impressions and clicks are not shown because Search Console is not connected.">
      <Tabs label="Language" value={loc} onChange={setLoc} tabs={[{ key: "en", label: "English" }, { key: "nl", label: "Nederlands" }]} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {tile("SEO health", `${score}%`, score >= 90, `${healthy} of ${published.length} published pages without problems`)}
        {tile("Missing titles", missingT, missingT === 0)}{tile("Missing descriptions", missingD, missingD === 0)}
        {tile("Duplicate metadata", dup, dup === 0)}{tile("Broken internal links", broken, broken === 0)}{tile("Images without alt text", altMissing, altMissing === 0, "Media used on the site")}
      </div>
      <div className="my-6 grid gap-4 lg:grid-cols-3">
        <Notice tone={sitemap === "error" ? "risk" : "ok"} title="Sitemap">{sitemap === null ? "Checking…" : sitemap === "error" ? "The sitemap could not be loaded." : <><a className="underline" href="/sitemap.xml" target="_blank" rel="noopener">/sitemap.xml</a> lists {sitemap} addresses, generated automatically from published pages and articles.</>}</Notice>
        <Notice tone="info" title="Canonical URLs and hreflang">Generated for every page from {SITE}, with English, Dutch and x-default alternates. Drafts and assessment results are never indexed.</Notice>
        <Notice tone="info" title="Search Console">Not configured in this application. Verify the domain in Google Search Console and submit the sitemap to see real search data.</Notice>
      </div>
      <FilterBar>
        <div className="!min-w-[14rem] flex-[2]"><SearchInput value={q} onChange={setQ} placeholder="Find a page" label="Find a page" /></div>
        <Field label="Show"><select className={inputCls} value={only} onChange={(e) => setOnly(e.target.value as "all" | "issues")}><option value="issues">Pages with problems</option><option value="all">All pages</option></select></Field>
      </FilterBar>
      <DataTable id="seo" caption="SEO checks per page" columns={columns} rows={shown.map((r) => ({ ...r, id: r.id }))}
        empty={<EmptyState compact icon={CheckCircle2} title={only === "issues" ? "No problems found" : "No pages"}>{only === "issues" ? "Every page in this language has a title and description, and no broken internal links." : "Nothing matches your search."}</EmptyState>} />
      {edit && <SeoEditor item={edit} onClose={() => setEdit(null)} onSaved={site.reload} />}
    </Page>
  );
}

/* --------------------------------- Redirects --------------------------------- */
export function RedirectsPage() {
  const { user, notify, query } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/redirects"));
  const [form, setForm] = useState<{ id?: number; from_path: string; to_path: string; status_code: number } | null>(query.get("new") ? { from_path: "", to_path: "", status_code: 301 } : null);
  const [err, setErr] = useState<{ field?: string; msg: string } | null>(null);
  const [q, setQ] = useState("");
  const edit = can(user, "content");
  const save = async () => {
    try { if (form!.id) await api("PUT", `/redirects/${form!.id}`, form); else await api("POST", "/redirects", form); notify("Redirect saved. It is active now."); setForm(null); setErr(null); reload(); }
    catch (e: any) { setErr({ field: e.details?.field, msg: e.message }); }
  };
  const list = (data?.redirects ?? []).filter((r: any) => !q || `${r.from_path} ${r.to_path}`.toLowerCase().includes(q.toLowerCase()));
  const columns: Column<any>[] = [
    { key: "from", header: "Old address", mobile: "title", render: (r) => <code className="text-[0.8125rem] text-heading">{r.from_path}</code> },
    { key: "to", header: "Redirects to", render: (r) => <a href={r.to_path} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[0.8125rem] text-cobalt hover:underline"><code>{r.to_path}</code><ExternalLink size={12} aria-hidden="true" /></a> },
    { key: "code", header: "Type", hideable: true, render: (r) => <Badge tone={r.status_code === 301 || r.status_code === 308 ? "info" : "neutral"}>{r.status_code} {r.status_code === 301 || r.status_code === 308 ? "permanent" : "temporary"}</Badge> },
    { key: "hits", header: "Used", hideable: true, render: (r) => <span className="tnum">{r.hits}{r.last_hit_at && <span className="block text-xs text-muted">last {timeAgo(r.last_hit_at)}</span>}</span> },
    { key: "by", header: "Added", hideable: true, hidden: true, render: (r) => <span className="text-xs">{fmtDay(r.created_at)}{r.created_by_name && ` · ${r.created_by_name}`}</span> },
    { key: "act", header: "", render: (r) => edit && <span className="flex gap-1"><Btn small onClick={() => { setErr(null); setForm({ id: r.id, from_path: r.from_path, to_path: r.to_path, status_code: r.status_code }); }}><Pencil size={13} /> Edit</Btn>
      <Btn small kind="danger" label={`Delete redirect from ${r.from_path}`} onClick={async () => { if (!(await confirmDialog({ title: "Delete this redirect?", body: <>Visitors to <code>{r.from_path}</code> will get a “page not found” error.</>, confirmLabel: "Delete", danger: true }))) return; await api("DELETE", `/redirects/${r.id}`); notify("Redirect deleted."); reload(); }}><Trash2 size={13} /></Btn></span> },
  ];
  return (
    <Page title="URL redirects" lead="Send visitors and search engines from an old address to a new one, for example after renaming a page. Redirects apply immediately."
      actions={edit && <Btn kind="primary" onClick={() => { setErr(null); setForm({ from_path: "", to_path: "", status_code: 301 }); }}><Plus size={15} /> Add redirect</Btn>}>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : (
        <>
          {(data?.redirects?.length ?? 0) > 5 && <div className="mb-4 max-w-sm"><SearchInput value={q} onChange={setQ} placeholder="Find a redirect" /></div>}
          <DataTable id="redirects" caption="URL redirects" columns={columns} rows={loading && !data ? null : list}
            empty={<EmptyState icon={Signpost} title="No redirects" actions={edit && <Btn small kind="primary" onClick={() => setForm({ from_path: "", to_path: "", status_code: 301 })}><Plus size={13} /> Add redirect</Btn>}>Use a redirect when a page moves, so old links and search results keep working.</EmptyState>} />
        </>
      )}
      {form && (
        <Modal open onClose={() => setForm(null)} title={form.id ? "Edit redirect" : "Add redirect"} footer={<><Btn onClick={() => setForm(null)}>Cancel</Btn><Btn kind="primary" onClick={save} disabled={!form.from_path || !form.to_path}>Save</Btn></>}>
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
            {err && !err.field && <Notice tone="risk">{err.msg}</Notice>}
            <Field label="Old address" required hint="A path on this site, for example /old-services" error={err?.field === "from_path" ? err.msg : null}><input data-autofocus className={`${inputCls} font-mono`} value={form.from_path} onChange={(e) => setForm({ ...form, from_path: e.target.value })} placeholder="/old-page" /></Field>
            <Field label="New address" required hint="A path like /services or a full https:// address" error={err?.field === "to_path" ? err.msg : null}><input className={`${inputCls} font-mono`} value={form.to_path} onChange={(e) => setForm({ ...form, to_path: e.target.value })} placeholder="/new-page/" /></Field>
            <Field label="Type" error={err?.field === "status_code" ? err.msg : null}><select className={inputCls} value={form.status_code} onChange={(e) => setForm({ ...form, status_code: Number(e.target.value) })}><option value={301}>301 Permanent (recommended for moved pages)</option><option value={302}>302 Temporary</option><option value={308}>308 Permanent (keeps form method)</option><option value={307}>307 Temporary (keeps form method)</option></select></Field>
            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </form>
        </Modal>
      )}
    </Page>
  );
}

/* -------------------------------- Localization -------------------------------- */
export function LocalizationPage() {
  const site = useSiteContent();
  const rows = useMemo(() => {
    if (!site.items) return null;
    const en = site.items.filter((x) => x.loc === "en");
    return en.map((e) => {
      const nl = site.items!.find((x) => x.loc === "nl" && x.baseKey === e.baseKey);
      const enN = textFields(e.data); const same = nl ? countSame(e.data, nl.data) : 0;
      return { id: e.baseKey, en: e, nl, state: !nl ? "missing" : nl.edited || e.kind !== "article" ? "translated" : "missing", identical: same, enFields: enN };
    });
  }, [site.items]);
  if (site.error) return <ErrorBox onRetry={site.reload}>{site.error}</ErrorBox>;
  if (!rows) return <Loading />;
  const articlesMissing = rows.filter((r) => r.en.kind === "article" && !r.nl).length;
  const columns: Column<any>[] = [
    { key: "item", header: "Content", mobile: "title", render: (r) => <div><span className="font-medium text-heading">{r.en.label}</span><span className="block text-xs text-muted">{r.en.group}</span></div> },
    { key: "nl", header: "Dutch version", render: (r) => !r.nl ? <Badge tone="warn" dot>Not translated</Badge> : r.nl.edited ? <Badge tone="ok" dot>Edited {fmtDay(r.nl.updated_at)}</Badge> : <Badge tone="info" dot>Built-in draft translation</Badge> },
    { key: "same", header: "Fields identical to English", hideable: true, render: (r) => r.nl ? <span className="tnum">{r.identical} of {r.enFields}</span> : "–" },
    { key: "act", header: "", render: (r) => <Btn small href={r.en.kind === "article" ? `#/articles/nl:${r.en.baseKey.slice(8)}` : `#/website/${encodeURIComponent(`nl:${r.en.baseKey}`)}`}><Languages size={13} /> {r.nl ? "Edit Dutch" : "Translate"}</Btn> },
  ];
  return (
    <Page title="Localization" lead="English is the default language; Dutch pages are at /nl. Pages ship with a draft Dutch translation that should be reviewed by a native speaker. Articles need their own translation.">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-[0.8125rem] text-muted">Pages with a Dutch version</p><p className="tnum mt-1 text-2xl font-semibold text-heading">{rows.filter((r) => r.en.kind !== "article" && r.nl).length} / {rows.filter((r) => r.en.kind !== "article").length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-[0.8125rem] text-muted">Dutch pages reviewed and saved</p><p className="tnum mt-1 text-2xl font-semibold text-heading">{rows.filter((r) => r.en.kind !== "article" && r.nl?.edited).length}</p></div>
        <div className="rounded-xl border border-line bg-surface p-4"><p className="text-[0.8125rem] text-muted">Articles without Dutch</p><p className={`tnum mt-1 text-2xl font-semibold ${articlesMissing ? "text-warn-fg" : "text-heading"}`}>{articlesMissing}</p></div>
      </div>
      <DataTable id="l10n" caption="Translation status" columns={columns} rows={rows} empty={<EmptyState compact icon={FileSearch} title="Nothing to translate" />} />
      <p className="mt-3 text-xs text-muted">“Fields identical to English” counts text fields that are the same in both languages, such as names and links, which is expected for some fields. Last checked {fmtDate(new Date().toISOString())}.</p>
    </Page>
  );
}
function countSame(a: any, b: any): number {
  let n = 0;
  const walk = (x: any, y: any) => { if (typeof x === "string") { if (x.trim() && x === y) n++; } else if (Array.isArray(x)) x.forEach((v, i) => walk(v, Array.isArray(y) ? y[i] : undefined)); else if (x && typeof x === "object") for (const k of Object.keys(x)) walk(x[k], y?.[k]); };
  walk(a, b);
  return n;
}
