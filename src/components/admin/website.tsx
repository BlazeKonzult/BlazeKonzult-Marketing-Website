/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element -- generic editor walks arbitrary content JSON; admin thumbnails need no optimiser */
"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, Copy, Download, ExternalLink, Eye, FileText, History, Image as ImageIcon, ImagePlus, LayoutGrid, List, Monitor, Newspaper, Pencil, Plus, RotateCcw, Smartphone, Tablet, Trash2, Upload } from "lucide-react";
import { API_BASE } from "@/lib/assessment/api";
import { REGISTRY, defaultsFor, defaultArticleSlugs, newArticle, articleDefaults } from "@/content/defaults";
import { mergeDefaults } from "@/content/merge";
import { localizeHref } from "@/lib/locale";
import { api, can, fmtDate, fmtDay, AdminError, getCsrf } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, Card, DL, Empty, EmptyState, ErrorBox, Field, FilterBar, inputCls, Loading, Modal, Notice, Page, SearchInput, StatusBadge, Tabs, useLoad, confirmDialog } from "./ui";
import { DataTable, type Column } from "./datatable";
import { useSiteContent, seoIssues } from "./sitecontent";
import { SerpPreview } from "./seo";

const enc = encodeURIComponent;
const err = (e: unknown) => (e as Error).message;

/* ------------------------------ Labels & field kinds ------------------------------ */
const WORDS: Record<string, string> = { seo: "SEO", href: "Link", cta: "Button", faq: "FAQ", faqs: "FAQs", nl: "Dutch", en: "English", url: "URL", linkedin: "LinkedIn URL", p: "Paragraph", h: "Heading", ul: "Bullet list" };
function label(key: string): string {
  if (/^\d+$/.test(key)) return `Item ${Number(key) + 1}`;
  if (WORDS[key]) return WORDS[key];
  const words = key.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/[_-]/g, " ").toLowerCase().split(" ").map((w) => (w === "cta" ? "button" : w === "seo" ? "SEO" : w === "href" ? "link" : w === "url" ? "URL" : w === "faq" ? "FAQ" : w));
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const IMAGE_KEY = /^(image|src|coverImage|founderPhoto|socialImage|.*Image|.*Photo)$/;
const LONG_KEY = /^(lead|description|body|text|answer|excerpt|summary|blurb|note|privacyNote|quote|paragraphs|regulatory|outcome|bestSuitedFor|bestFor|shortDescription|p|intro|notice)$/;
const CHOICES: Record<string, string[]> = {
  status: ["published", "draft"],
  visual: ["maturity", "regulation", "governance", "cycle", "awareness", "response", "assurance"],
  category: ["Assess", "Prepare", "Govern", "Educate", "Respond", "Improve"],
};
const ICONS = "Activity AlertTriangle BarChart3 Briefcase Bug CalendarCheck2 CalendarRange ClipboardCheck Cloud CloudCog Compass Crosshair DatabaseBackup Factory FileCheck2 FileQuestion FileText FolderCheck Gauge GraduationCap HeartPulse Landmark LifeBuoy Link2 ListChecks ListOrdered ListTodo MailWarning MessagesSquare Network Presentation Route Scale ScanSearch SearchCheck SearchX Server Shield ShieldCheck Table2 Truck UserCheck UserX Users2 Lock KeyRound Building2 Globe Laptop Cpu".split(" ");

/** Blank copy of a value, used as the template when adding an item to a list. */
function blank(v: any): any {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return v.length && typeof v[0] === "string" ? [""] : [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return "";
}
function summary(v: any): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") { for (const k of ["title", "name", "label", "question", "heading", "code", "phase", "step", "h", "p"]) if (typeof v[k] === "string" && v[k]) return v[k]; }
  return "";
}

/* ------------------------------------ Field editor ------------------------------------ */
type EditorProps = { name: string; value: any; template?: any; onChange: (v: any) => void; depth: number; pickImage: (cb: (url: string) => void) => void };

function ValueEditor({ name, value, template, onChange, depth, pickImage }: EditorProps) {
  if (name === "body" && Array.isArray(value)) return <BlocksEditor value={value} onChange={onChange} />;
  if (typeof value === "string") return <StringField name={name} value={value} onChange={onChange} pickImage={pickImage} />;
  if (typeof value === "number") return <Field label={label(name)}><input type="number" className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>;
  if (typeof value === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="check" checked={value} onChange={(e) => onChange(e.target.checked)} /> {label(name)}</label>;
  if (Array.isArray(value)) return <ListEditor name={name} value={value} template={template} onChange={onChange} depth={depth} pickImage={pickImage} />;
  if (value && typeof value === "object") return <ObjectEditor name={name} value={value} template={template} onChange={onChange} depth={depth} pickImage={pickImage} />;
  return null;
}

function StringField({ name, value, onChange, pickImage }: { name: string; value: string; onChange: (v: string) => void; pickImage: EditorProps["pickImage"] }) {
  const id = useId();
  if (IMAGE_KEY.test(name)) {
    return (
      <div className="text-sm">
        <label htmlFor={id} className="mb-1 block font-semibold text-heading">{label(name)}</label>
        <div className="flex flex-wrap items-center gap-3">
          {value && /^(\/|https:)/.test(value) && <img src={value} alt="" className="h-16 w-16 rounded-md border border-line object-cover" />}
          <input id={id} className={`${inputCls} min-w-0 flex-1`} value={value} placeholder="No image (uses the default design)" onChange={(e) => onChange(e.target.value)} />
          <Btn small onClick={() => pickImage(onChange)}><ImagePlus size={14} /> Choose</Btn>
          {value && <Btn small kind="ghost" onClick={() => onChange("")}>Remove</Btn>}
        </div>
      </div>
    );
  }
  if (CHOICES[name] && (CHOICES[name].includes(value) || !value)) {
    return <Field label={label(name)}><select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>{CHOICES[name].map((c) => <option key={c}>{c}</option>)}</select></Field>;
  }
  if (name === "icon") {
    return <Field label="Icon" hint="Name of a Lucide icon"><input className={inputCls} list="bk-icons" value={value} onChange={(e) => onChange(e.target.value)} /></Field>;
  }
  if (name === "date") return <Field label="Date"><input type="date" className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} /></Field>;
  const long = LONG_KEY.test(name) || value.length > 90 || value.includes("\n");
  return (
    <Field label={label(name)} hint={long ? "Links: [text](/page) · bold: **text**" : /href|Href/.test(name) ? "A page path like /contact or a full https:// address" : undefined}>
      {long ? <textarea className={inputCls} rows={Math.min(8, Math.max(2, Math.ceil(value.length / 90)))} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

function ObjectEditor({ name, value, template, onChange, depth, pickImage }: EditorProps) {
  const entries = Object.entries(value);
  const simple = entries.every(([, v]) => typeof v !== "object" || v === null);
  const body = (
    <div className={`grid gap-4 ${simple && entries.length > 1 && entries.every(([k, v]) => typeof v !== "string" || (!LONG_KEY.test(k) && (v as string).length < 90)) ? "sm:grid-cols-2" : ""}`}>
      {entries.map(([k, v]) => <ValueEditor key={k} name={k} value={v} template={template?.[k]} depth={depth + 1} pickImage={pickImage} onChange={(nv) => onChange({ ...value, [k]: nv })} />)}
    </div>
  );
  if (depth === 0) return body;
  if (depth === 1) return <Section sid={name} title={label(name)}>{body}</Section>;
  return <fieldset className="min-w-0 rounded-lg border border-line p-4"><legend className="px-1 text-sm font-semibold text-heading">{label(name)}</legend>{body}</fieldset>;
}

function Section({ title, children, sid }: { title: string; children: React.ReactNode; sid: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === sid) setOpen(true); };
    window.addEventListener("bk-open-section", on);
    return () => window.removeEventListener("bk-open-section", on);
  }, [sid]);
  return (
    <section id={`sec-${sid}`} className="scroll-mt-24 rounded-xl border border-line bg-surface shadow-[var(--a-shadow-card)]">
      <button type="button" className="flex w-full items-center justify-between gap-3 rounded-xl px-5 py-4 text-left text-[0.9375rem] font-semibold text-heading hover:bg-surface-2" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}<ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="border-t border-line p-5">{children}</div>}
    </section>
  );
}

function ListEditor({ name, value, template, onChange, depth, pickImage }: EditorProps) {
  const tpl = value[0] ?? (Array.isArray(template) ? template[0] : undefined) ?? "";
  const move = (i: number, d: number) => { const a = [...value]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a); };
  const strings = value.every((v: any) => typeof v === "string") && typeof tpl === "string";
  const inner = (
    <div className="space-y-2">
      {value.map((item: any, i: number) => (
        <div key={i} className={strings ? "flex items-start gap-2" : "rounded-md border border-line bg-paper p-3"}>
          {strings ? (
            <div className="flex-1">{(LONG_KEY.test(name) || item.length > 90)
              ? <textarea aria-label={`${label(name)} ${i + 1}`} className={inputCls} rows={Math.min(6, Math.max(2, Math.ceil(item.length / 90)))} value={item} onChange={(e) => { const a = [...value]; a[i] = e.target.value; onChange(a); }} />
              : <input aria-label={`${label(name)} ${i + 1}`} className={inputCls} value={item} onChange={(e) => { const a = [...value]; a[i] = e.target.value; onChange(a); }} />}</div>
          ) : (
            <div className="mb-2 flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-muted">{i + 1}. {summary(item).slice(0, 80)}</span></div>
          )}
          {!strings && <ValueEditor name={String(i)} value={item} template={tpl} depth={depth + 1} pickImage={pickImage} onChange={(nv) => { const a = [...value]; a[i] = nv; onChange(a); }} />}
          <div className={`flex gap-0.5 ${strings ? "shrink-0 pt-1.5" : "mt-2 justify-end"}`}>
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={15} /></button>
            <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={15} /></button>
            <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_: any, j: number) => j !== i))} className="p-1 text-risk-fg"><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
      <Btn small onClick={() => onChange([...value, blank(tpl)])}><Plus size={13} /> Add {strings ? "line" : "item"}</Btn>
    </div>
  );
  if (depth <= 1) return <Section sid={name} title={`${label(name)} (${value.length})`}>{inner}</Section>;
  return <div className="text-sm"><p className="mb-1 font-semibold text-heading">{label(name)}</p>{inner}</div>;
}

/** Article body: headings, paragraphs and bullet lists. */
function BlocksEditor({ value, onChange }: { value: any[]; onChange: (v: any[]) => void }) {
  const set = (i: number, b: any) => { const a = [...value]; a[i] = b; onChange(a); };
  const move = (i: number, d: number) => { const a = [...value]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a); };
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <h3 className="font-semibold text-heading">Article text</h3>
      <p className="mt-1 text-xs text-muted">Paragraphs and list items support [link text](/page) and **bold**.</p>
      <div className="mt-4 space-y-3">
        {value.map((b, i) => (
          <div key={i} className="rounded-md border border-line bg-paper p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
              <span>{"h" in b ? "Heading" : "ul" in b ? "Bullet list (one item per line)" : "Paragraph"}</span>
              <span className="flex gap-0.5">
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" aria-label="Remove block" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-risk-fg"><Trash2 size={14} /></button>
              </span>
            </div>
            {"h" in b ? <input aria-label="Heading" className={`${inputCls} font-semibold`} value={b.h} onChange={(e) => set(i, { h: e.target.value })} />
              : "ul" in b ? <textarea aria-label="Bullet list" className={inputCls} rows={Math.max(3, b.ul.length + 1)} value={b.ul.join("\n")} onChange={(e) => set(i, { ul: e.target.value.split("\n") })} />
                : <textarea aria-label="Paragraph" className={inputCls} rows={Math.min(10, Math.max(3, Math.ceil((b.p ?? "").length / 90)))} value={b.p} onChange={(e) => set(i, { p: e.target.value })} />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn small onClick={() => onChange([...value, { h: "" }])}><Plus size={13} /> Heading</Btn>
        <Btn small onClick={() => onChange([...value, { p: "" }])}><Plus size={13} /> Paragraph</Btn>
        <Btn small onClick={() => onChange([...value, { ul: [""] }])}><Plus size={13} /> Bullet list</Btn>
      </div>
    </section>
  );
}

/* ------------------------------------ Uploads ------------------------------------ */
/** Upload one file with progress (XHR, so the progress bar is real). */
function uploadOne(f: File, onProgress: (pct: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("POST", `${API_BASE}/admin/media`);
    x.withCredentials = true;
    x.setRequestHeader("content-type", f.type || "application/octet-stream");
    x.setRequestHeader("x-filename", enc(f.name));
    x.setRequestHeader("x-csrf-token", getCsrf());
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((100 * e.loaded) / e.total)); };
    x.onload = () => { let j: any = null; try { j = JSON.parse(x.responseText); } catch { /* ignore */ } if (x.status >= 200 && x.status < 300) resolve(j); else reject(new AdminError(j?.error?.message ?? "Upload failed", x.status, "upload")); };
    x.onerror = () => reject(new AdminError("Cannot reach the server.", 0, "network"));
    x.send(f);
  });
}
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
type UploadState = { name: string; pct: number; error?: string; done?: boolean };

function Dropzone({ onFiles, compact }: { onFiles: (files: File[]) => void; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); const f = Array.from(e.dataTransfer.files).filter((x) => ACCEPT.includes(x.type)); if (f.length) onFiles(f); }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${compact ? "px-4 py-5" : "px-6 py-10"} ${over ? "border-brand bg-brand-50" : "border-line-strong bg-surface-2"}`}>
      <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-surface text-muted ring-1 ring-line"><Upload size={18} aria-hidden="true" /></span>
      <p className="text-sm text-heading"><button type="button" className="font-semibold text-cobalt hover:underline" onClick={() => input.current?.click()}>Choose images</button> or drag them here</p>
      <p className="mt-1 text-xs text-muted">PNG, JPEG, WebP or GIF · up to 5 MB each · several at once</p>
      <input ref={input} type="file" multiple accept={ACCEPT} className="sr-only" aria-label="Choose images to upload" onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) onFiles(f); }} />
    </div>
  );
}
function useUploads(onDone: () => void) {
  const [list, setList] = useState<UploadState[]>([]);
  const start = useCallback(async (files: File[]) => {
    const base = files.map((f) => ({ name: f.name, pct: 0 }));
    setList(base);
    const results: any[] = [];
    for (let i = 0; i < files.length; i++) {
      try { results.push(await uploadOne(files[i], (pct) => setList((l) => l.map((x, j) => (j === i ? { ...x, pct } : x))))); setList((l) => l.map((x, j) => (j === i ? { ...x, pct: 100, done: true } : x))); }
      catch (e) { setList((l) => l.map((x, j) => (j === i ? { ...x, error: err(e) } : x))); }
    }
    onDone();
    return results;
  }, [onDone]);
  const view = list.length ? (
    <ul className="mt-3 space-y-2" aria-live="polite">
      {list.map((u, i) => (
        <li key={i} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-3"><span className="truncate text-heading">{u.name}</span><span className={`shrink-0 text-xs ${u.error ? "text-risk-fg" : u.done ? "text-ok-fg" : "text-muted"}`}>{u.error ?? (u.done ? "Uploaded" : `${u.pct}%`)}</span></div>
          {!u.error && !u.done && <div className="mt-1.5 h-1.5 rounded-full bg-mist" role="progressbar" aria-label={`Uploading ${u.name}`} aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${u.pct}%` }} /></div>}
        </li>
      ))}
    </ul>
  ) : null;
  return { start, view, clear: () => setList([]) };
}

/* ------------------------------------ Media picker ------------------------------------ */
function useMediaPicker() {
  const [cb, setCb] = useState<((url: string) => void) | null>(null);
  const pick = useCallback((f: (url: string) => void) => setCb(() => f), []);
  const modal = cb ? <MediaModal onPick={(u) => { cb(u); setCb(null); }} onClose={() => setCb(null)} /> : null;
  return { pick, modal };
}
function MediaModal({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const { data, loading, error, reload } = useLoad(() => api("GET", "/media"));
  const [q, setQ] = useState("");
  const up = useUploads(reload);
  const list = (data?.media ?? []).filter((m: any) => !q || `${m.original_name} ${m.alt ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal open onClose={onClose} title="Choose an image" size="xl" description="Pick from the media library or upload a new image.">
      <div className="grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div><Dropzone compact onFiles={async (f) => { const r = await up.start(f); if (r.length === 1 && r[0]?.url) onPick(r[0].url); }} />{up.view}</div>
        <div>
          <SearchInput value={q} onChange={setQ} placeholder="Search images" className="mb-3" />
          {loading && !data ? <Loading rows={2} /> : error ? <ErrorBox>{error}</ErrorBox> : !list.length ? <Empty>{q ? "No images match." : "No images yet. Upload one."}</Empty> : (
            <ul className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 xl:grid-cols-4">
              {list.map((m: any) => (
                <li key={m.id}><button type="button" onClick={() => onPick(m.url)} className="group block w-full rounded-lg border border-line p-1.5 text-left transition-colors hover:border-brand focus-visible:border-brand">
                  <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full rounded-md bg-mist object-cover" />
                  <span className="mt-1 block truncate px-0.5 text-xs text-heading">{m.original_name}</span>
                  {!m.alt && <span className="block px-0.5 text-[0.6875rem] text-warn-fg">No alt text</span>}
                </button></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------ Live preview ------------------------------------ */
function PreviewModal({ path, onClose }: { path: string; onClose: () => void }) {
  const [w, setW] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [n, setN] = useState(0);
  const width = { desktop: "100%", tablet: "768px", mobile: "390px" }[w];
  return (
    <Modal open onClose={onClose} size="xl" title="Live page preview" description={<>Shows the published page at <code>{path}</code>. Saved changes appear here immediately.</>}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Device width" className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
          {([["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"]] as const).map(([k, I, l]) => <button key={k} type="button" role="radio" aria-checked={w === k} onClick={() => setW(k)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium ${w === k ? "bg-surface text-heading shadow-sm" : "text-muted hover:text-heading"}`}><I size={15} aria-hidden="true" />{l}</button>)}
        </div>
        <span className="flex gap-2"><Btn small onClick={() => setN((x) => x + 1)}><RotateCcw size={13} /> Reload</Btn><Btn small href={path} target="_blank">Open in new tab <ExternalLink size={13} /></Btn></span>
      </div>
      <div className="flex justify-center overflow-hidden rounded-xl border border-line bg-mist p-2">
        <iframe key={n} src={path} title="Page preview" className="h-[65vh] rounded-lg border border-line bg-white transition-[width]" style={{ width, maxWidth: "100%" }} />
      </div>
    </Modal>
  );
}

/* ------------------------------------ Document editor ------------------------------------ */
function DocEditor({ docKey, title, path, onDone, isNewArticle, langSwitch }: { docKey: string; title: string; path: string; onDone?: () => void; isNewArticle?: boolean; langSwitch?: React.ReactNode }) {
  const { user, notify, go } = useAdmin();
  const isNl = docKey.startsWith("nl:");
  const baseKey = isNl ? docKey.slice(3) : docKey;
  const isArticle = baseKey.startsWith("article:");
  const english = useLoad(() => (isNl && isArticle ? api("GET", `/content/${enc(baseKey)}`) : Promise.resolve(null)), [docKey]);
  const defaults = useMemo(() => {
    if (isArticle) { const base = articleDefaults(baseKey.slice(8)) ?? newArticle(); return isNl ? mergeDefaults(base as any, english.data?.doc?.data) : base; }
    return defaultsFor(baseKey, isNl ? "nl" : "en");
  }, [baseKey, isArticle, isNl, english.data]);
  const saved = useLoad(() => api("GET", `/content/${enc(docKey)}`), [docKey]);
  const [value, setValue] = useState<any>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showRev, setShowRev] = useState(false);
  const [preview, setPreview] = useState(false);
  const { pick, modal } = useMediaPicker();
  const edit = can(user, "content");

  useEffect(() => {
    if (saved.loading || saved.error || english.loading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise the form from loaded content
    setValue(mergeDefaults(defaults as any, saved.data?.doc?.data));
    setDirty(false);
  }, [saved.loading, saved.error, saved.data, defaults, english.loading]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  // Keyboard: Cmd/Ctrl+S saves (clicks the save button so the latest state is used).
  useEffect(() => { const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); document.querySelector<HTMLButtonElement>("#bk-save-wrap button")?.click(); } }; window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on); }, []);

  if (saved.error) return <ErrorBox onRetry={saved.reload}>{saved.error}</ErrorBox>;
  if (saved.loading || !value) return <Loading />;
  const customised = !!saved.data?.doc;
  const save = async () => {
    if (!edit || busy) return;
    setBusy(true);
    try { await api("PUT", `/content/${enc(docKey)}`, { data: value }); notify("Saved and published. The change is live on the website."); setDirty(false); saved.reload(); onDone?.(); }
    catch (e) { notify(err(e), "risk"); }
    setBusy(false);
  };
  const sections = Object.entries(value).filter(([, v]) => v && typeof v === "object").map(([k]) => k);
  const seo = value.seo ?? {};
  return (
    <div className="a-fade">
      <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" data-noprint>
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-heading">{title}</h1>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {dirty ? <Badge tone="warn" dot>Unsaved changes</Badge> : customised ? <Badge tone="ok" dot>Published</Badge> : isNewArticle ? <Badge tone="warn" dot>New, not saved</Badge> : <Badge dot>Original text</Badge>}
              <code>{path}</code>
            </p>
          </div>
          {langSwitch}
          <Btn onClick={() => setPreview(true)} disabled={isNewArticle && !customised}><Eye size={15} /> Preview</Btn>
          {edit && <span id="bk-save-wrap"><Btn kind="primary" onClick={save} disabled={!dirty && customised} busy={busy}>{dirty || !customised ? "Save and publish" : "Saved"}</Btn></span>}
        </div>
      </div>
      <datalist id="bk-icons">{ICONS.map((i) => <option key={i} value={i} />)}</datalist>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[13rem_minmax(0,1fr)_20rem]">
        <nav aria-label="Page structure" className="hidden xl:block">
          <div className="sticky top-40">
            <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">Sections</p>
            <ul className="space-y-0.5 text-sm">{sections.map((s) => <li key={s}><a href={`#sec-${s}`} onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("bk-open-section", { detail: s })); setTimeout(() => document.getElementById(`sec-${s}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }} className="block truncate rounded-md px-2 py-1.5 text-body hover:bg-mist hover:text-heading">{label(s)}</a></li>)}</ul>
          </div>
        </nav>
        <div className="min-w-0">
          {!edit && <div className="mb-4"><Notice tone="info">You can view this page but your role cannot edit it.</Notice></div>}
          <fieldset disabled={!edit} className="min-w-0 space-y-3">
            <ValueEditor name="" value={value} template={defaults} depth={0} pickImage={pick} onChange={(v) => { setValue(v); setDirty(true); }} />
          </fieldset>
          <p className="mt-4 text-xs text-muted">Text fields support [link text](/page) and **bold**. HTML and scripts are not allowed, so content always follows the site design. Press {typeof navigator !== "undefined" && /Mac/.test(navigator.platform) ? "⌘" : "Ctrl"}+S to save.</p>
        </div>
        <aside className="space-y-4" aria-label="Publishing">
          <Card title="Publishing">
            <DL rows={[["Status", isArticle ? <StatusBadge key="s" status={value.status} /> : <StatusBadge key="s" status="published" />], ["Language", isNl ? "Nederlands" : "English"], ["Address", <a key="a" href={path} target="_blank" rel="noopener" className="inline-flex items-center gap-1 break-all text-cobalt hover:underline">{path}<ExternalLink size={12} aria-hidden="true" /></a>],
              ["Last saved", customised ? `${fmtDate(saved.data.doc.updated_at)}` : "Never (original text)"], ...(isArticle ? [["Author", value.author], ["Date", value.date]] as [string, string][] : [])]} />
            {isArticle && <p className="mt-3 text-xs text-muted">Set Status to draft in the form to hide the article from the website.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn small onClick={() => setShowRev(true)}><History size={13} /> Revisions</Btn>
              {edit && customised && !isNewArticle && <Btn small onClick={async () => { if (!(await confirmDialog({ title: "Reset to the original text?", body: "All edits to this page are discarded and the built-in text is shown again. The current version is kept in Revisions.", confirmLabel: "Reset", danger: true }))) return; await api("DELETE", `/content/${enc(docKey)}`); notify("Restored the original text."); saved.reload(); }}><RotateCcw size={13} /> Reset</Btn>}
            </div>
          </Card>
          {"seo" in value && <Card title="Search & sharing" actions={<Btn small kind="ghost" onClick={() => go("seo")}>SEO overview</Btn>}>
            <SerpPreview title={seo.title || (isArticle ? value.title : "")} description={seo.description || (isArticle ? value.excerpt : "")} path={path} />
            <p className="mt-2 text-xs text-muted">Edit the title and description in the SEO section of the form.</p>
          </Card>}
        </aside>
      </div>
      {showRev && <Modal open onClose={() => setShowRev(false)} title="Revisions" description="Every save is kept (up to 50). Restoring makes that version live immediately." size="lg"><Revisions docKey={docKey} onRestored={() => { setShowRev(false); saved.reload(); }} /></Modal>}
      {preview && <PreviewModal path={path} onClose={() => setPreview(false)} />}
      {modal}
    </div>
  );
}

function Revisions({ docKey, onRestored }: { docKey: string; onRestored: () => void }) {
  const { user, notify } = useAdmin();
  const { data, loading, error } = useLoad(() => api("GET", `/content/${enc(docKey)}/revisions`), [docKey]);
  if (loading) return <Loading rows={3} />;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!data.revisions.length) return <Empty>No saved versions yet. The page is showing its original text.</Empty>;
  return (
    <ol className="divide-y divide-line text-sm">
      {data.revisions.map((r: any, i: number) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <span><span className="font-medium text-heading">{fmtDate(r.created_at)}</span> <span className="text-muted">· {r.user_name ?? "System"} · {r.action === "reset" ? "reset to original" : r.action}</span>{i === 0 && <> <Badge tone="ok">Current</Badge></>}</span>
          {can(user, "content") && i > 0 && <Btn small onClick={async () => { if (!(await confirmDialog({ title: "Restore this version?", body: "It becomes live immediately. The current version stays in the list.", confirmLabel: "Restore" }))) return; await api("POST", `/revisions/${r.id}/restore`, {}); notify("Version restored."); onRestored(); }}>Restore</Btn>}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------ Pages list ------------------------------------ */
const LANG_KEY = "bk-admin-lang";
function useLang(): ["en" | "nl", (l: "en" | "nl") => void] {
  const [lang, setLang] = useState<"en" | "nl">("en");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the last chosen language after hydration
  useEffect(() => { try { if (localStorage.getItem(LANG_KEY) === "nl") setLang("nl"); } catch { /* ignore */ } }, []);
  return [lang, (l) => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } }];
}
function LangSwitch({ lang, setLang }: { lang: "en" | "nl"; setLang: (l: "en" | "nl") => void }) {
  return (
    <div role="radiogroup" aria-label="Language" className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {(["en", "nl"] as const).map((l) => <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={`rounded-md px-3 py-1.5 text-[0.8125rem] font-medium ${lang === l ? "bg-heading text-surface" : "text-body hover:text-heading"}`}>{l === "en" ? "English" : "Nederlands"}</button>)}
    </div>
  );
}

export function WebsitePages({ docKey, group }: { docKey?: string; group?: string }) {
  const site = useSiteContent();
  const [lang, setLang] = useLang();
  const [q, setQ] = useState("");
  const [g, setG] = useState(group ?? "");
  if (docKey) {
    const nl = docKey.startsWith("nl:");
    const info = REGISTRY.find((r) => r.key === (nl ? docKey.slice(3) : docKey));
    if (!info) return <ErrorBox>Unknown page.</ErrorBox>;
    return <DocEditor key={docKey} docKey={docKey} title={info.label} path={localizeHref(info.path, nl ? "nl" : "en")}
      langSwitch={<LangSwitch lang={nl ? "nl" : "en"} setLang={(l) => { setLang(l); window.location.hash = `/website/${enc(l === "nl" ? `nl:${info.key}` : info.key)}`; }} />} />;
  }
  const rows = (site.items ?? []).filter((x) => x.kind !== "article" && x.loc === lang && (!g || x.group === g) && (!q || `${x.label} ${x.path}`.toLowerCase().includes(q.toLowerCase())));
  const all = site.items ?? [];
  const columns: Column<any>[] = [
    { key: "page", header: "Page", mobile: "title", render: (r) => <div className="min-w-0"><a href={`#/website/${enc(r.storeKey)}`} className="font-medium text-heading hover:text-brand hover:underline">{r.label}</a><span className="block text-xs text-muted">{r.group}</span></div> },
    { key: "path", header: "Address", hideable: true, render: (r) => <a className="inline-flex items-center gap-1 text-xs text-muted hover:text-cobalt" href={r.path} target="_blank" rel="noopener"><code>{r.path}</code><ExternalLink size={11} aria-hidden="true" /></a> },
    { key: "status", header: "Status", render: (r) => r.edited ? <Badge tone="ok" dot>Published · edited</Badge> : <Badge dot>Published · original text</Badge> },
    { key: "langs", header: "Translations", hideable: true, render: (r) => { const other = all.find((x) => x.baseKey === r.baseKey && x.loc !== r.loc); return <span className="flex gap-1"><Badge tone={r.loc === "en" ? "brand" : "neutral"}>EN</Badge><Badge tone={other?.edited || r.loc === "nl" ? (r.loc === "nl" ? "brand" : "info") : "neutral"}>NL{other && !other.edited && r.loc === "en" ? " draft" : ""}</Badge></span>; } },
    { key: "seo", header: "SEO", hideable: true, render: (r) => { if (r.kind === "site") return <span className="text-muted">–</span>; const iss = seoIssues(r, all); return iss.some((i) => i.severity === "high") ? <Badge tone="risk" dot>Missing</Badge> : iss.length ? <Badge tone="warn" dot>{iss.length} to improve</Badge> : <Badge tone="ok" dot>Good</Badge>; } },
    { key: "mod", header: "Last modified", hideable: true, render: (r) => r.updated_at ? <span className="text-xs"><span className="text-heading">{fmtDay(r.updated_at)}</span>{r.updated_by && <span className="block text-muted">{r.updated_by}</span>}</span> : <span className="text-xs text-muted">Never</span> },
    { key: "act", header: "", render: (r) => <span className="flex gap-1"><Btn small href={`#/website/${enc(r.storeKey)}`}><Pencil size={13} /> Edit</Btn><Btn small kind="subtle" href={r.path} target="_blank" label={`View ${r.label} live`}><ExternalLink size={13} /></Btn></span> },
  ];
  const groups = ["Site", "Pages", "Services", "Legal"];
  return (
    <Page title={g === "Services" ? "Services" : "Pages"} lead="Every page of the website in English and Dutch. Edit text, links, images and SEO; saved changes are live immediately and each save is kept as a revision."
      actions={<LangSwitch lang={lang} setLang={setLang} />}>
      <FilterBar>
        <div className="!min-w-[14rem] flex-[2]"><SearchInput value={q} onChange={setQ} placeholder="Find a page" label="Find a page" /></div>
        <Field label="Section"><select className={inputCls} value={g} onChange={(e) => setG(e.target.value)}><option value="">All sections</option>{groups.map((x) => <option key={x} value={x}>{x === "Site" ? "Site settings, navigation & footer" : x}</option>)}</select></Field>
      </FilterBar>
      {site.error ? <ErrorBox onRetry={site.reload}>{site.error}</ErrorBox> : <DataTable id="pages" caption="Website pages" columns={columns} rows={site.items ? rows : null} rowHref={(r) => `#/website/${enc(r.storeKey)}`}
        empty={<EmptyState compact icon={FileText} title="No pages match">Try another search or section.</EmptyState>} />}
      <p className="mt-3 text-xs text-muted">The page structure and section order follow the site design. Assessment pages are managed under Assessment templates; articles under Insights & articles.</p>
    </Page>
  );
}

/* ------------------------------------ Articles ------------------------------------ */
export function Articles({ slug }: { slug?: string }) {
  const { user, notify, go, query } = useAdmin();
  const site = useSiteContent();
  const [newOpen, setNewOpen] = useState(!!query.get("new"));
  const [newSlug, setNewSlug] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">((query.get("status") as "draft") ?? "all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const isNew = slug?.startsWith("new:");

  if (slug) {
    const nl = slug.startsWith("nl:");
    const real = isNew ? slug.slice(4) : nl ? slug.slice(3) : slug;
    return <>
      <DocEditor key={slug} docKey={nl ? `nl:article:${real}` : `article:${real}`} title={isNew ? "New article" : nl ? "Article (Dutch version)" : "Article"} path={`${nl ? "/nl" : ""}/resources/${real}/`} isNewArticle={isNew}
        onDone={() => { if (isNew) go(`articles/${real}`); }}
        langSwitch={!isNew && <LangSwitch lang={nl ? "nl" : "en"} setLang={(l) => go(`articles/${l === "nl" ? `nl:${real}` : real}`)} />} />
      {nl && <p className="mt-6 text-xs text-muted">Until a Dutch version is saved, Dutch visitors see the English article with a short note.</p>}
    </>;
  }
  const en = (site.items ?? []).filter((x) => x.kind === "article" && x.loc === "en");
  const cats = [...new Set(en.map((a) => a.data.category))].sort();
  const rows = en.filter((a) => (status === "all" || a.status === status) && (!cat || a.data.category === cat) && (!q || `${a.label} ${a.data.excerpt}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (a.data.date < b.data.date ? 1 : -1)).map((a) => ({ ...a, id: a.baseKey, slug: a.baseKey.slice(8), dutch: (site.items ?? []).some((x) => x.loc === "nl" && x.baseKey === a.baseKey) }));
  const slugOk = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(newSlug);
  const columns: Column<any>[] = [
    { key: "title", header: "Article", mobile: "title", render: (a) => <div className="min-w-0 max-w-md"><a className="font-medium text-heading hover:text-brand hover:underline" href={`#/articles/${a.slug}`}>{a.label}</a><span className="block truncate text-xs text-muted">/resources/{a.slug}/</span></div> },
    { key: "cat", header: "Category", hideable: true, render: (a) => <Badge>{a.data.category}</Badge> },
    { key: "date", header: "Date", hideable: true, render: (a) => <span className="whitespace-nowrap">{fmtDay(a.data.date)}</span> },
    { key: "read", header: "Reading time", hideable: true, hidden: true, render: (a) => a.data.readTime },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
    { key: "nl", header: "Dutch", hideable: true, render: (a) => <a className="text-xs font-medium text-cobalt hover:underline" href={`#/articles/nl:${a.slug}`}>{a.dutch ? "Edit translation" : "Translate"}</a> },
    { key: "mod", header: "Last modified", hideable: true, render: (a) => a.updated_at ? <span className="text-xs">{fmtDay(a.updated_at)}{a.updated_by && <span className="block text-muted">{a.updated_by}</span>}</span> : <span className="text-xs text-muted">Original</span> },
    { key: "act", header: "", render: (a) => <span className="flex gap-1">
      <Btn small href={`#/articles/${a.slug}`}><Pencil size={13} /> Edit</Btn>
      {a.status === "published" && <Btn small kind="subtle" href={`/resources/${a.slug}/`} target="_blank" label="View live"><ExternalLink size={13} /></Btn>}
      {can(user, "delete") && <Btn small kind="danger" label={`Delete ${a.label}`} onClick={async () => {
        if (!(await confirmDialog({ title: `Delete “${a.label}”?`, body: "The article is removed from the website. Its revisions are kept.", confirmLabel: "Delete article", danger: true }))) return;
        try {
          if (defaultArticleSlugs.includes(a.slug)) await api("PUT", `/content/${enc(`article:${a.slug}`)}`, { data: { ...a.data, deleted: true, status: "draft" } });
          else await api("DELETE", `/content/${enc(`article:${a.slug}`)}`);
          notify("Article deleted."); site.reload();
        } catch (e) { notify(err(e), "risk"); }
      }}><Trash2 size={13} /></Btn>}
    </span> },
  ];
  return (
    <Page title="Insights & articles" lead="Cybersecurity insights shown on the Insights page. Drafts are hidden from the website until their status is set to published."
      actions={can(user, "content") && <Btn kind="primary" onClick={() => setNewOpen(true)}><Plus size={15} /> New article</Btn>}>
      <Tabs label="Article status" value={status} onChange={setStatus} tabs={[{ key: "all", label: "All", count: site.items ? en.length : null }, { key: "published", label: "Published", count: site.items ? en.filter((a) => a.status === "published").length : null }, { key: "draft", label: "Drafts", count: site.items ? en.filter((a) => a.status === "draft").length : null }]} />
      <FilterBar>
        <div className="!min-w-[14rem] flex-[2]"><SearchInput value={q} onChange={setQ} placeholder="Search titles and excerpts" /></div>
        <Field label="Category"><select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
      </FilterBar>
      {site.error ? <ErrorBox onRetry={site.reload}>{site.error}</ErrorBox> : <DataTable id="articles" caption="Articles" columns={columns} rows={site.items ? rows : null} rowHref={(a) => `#/articles/${a.slug}`}
        empty={status === "all" && !q && !cat ? <EmptyState icon={Newspaper} title="No articles published" actions={can(user, "content") && <Btn small kind="primary" onClick={() => setNewOpen(true)}><Plus size={13} /> Create your first article</Btn>}>Publish cybersecurity insights to educate potential customers and strengthen your website&apos;s search visibility.</EmptyState>
          : <EmptyState compact icon={Newspaper} title="No articles match">Try another status, category or search.</EmptyState>} />}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New article" description="Choose the web address first. You can write and publish on the next screen."
        footer={<><Btn onClick={() => setNewOpen(false)}>Cancel</Btn><Btn kind="primary" disabled={!slugOk} onClick={() => { if (en.some((a) => a.baseKey === `article:${newSlug}`)) { notify("An article with this address already exists.", "risk"); return; } setNewOpen(false); go(`articles/new:${newSlug}`); }}>Continue</Btn></>}>
        <Field label="Web address (slug)" hint={<>The article will be at <code>/resources/{newSlug || "your-slug"}/</code>. Lowercase letters, numbers and hyphens.</>}><input data-autofocus className={`${inputCls} font-mono`} value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))} placeholder="backup-basics-for-smes" /></Field>
      </Modal>
    </Page>
  );
}

/* ------------------------------------ Media library ------------------------------------ */
export function MediaLibrary() {
  const { user, notify, query } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/media"));
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState(query.get("q") ?? "");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("new");
  const [showUpload, setShowUpload] = useState(!!query.get("upload"));
  const [sel, setSel] = useState<any>(null);
  const up = useUploads(useCallback(() => { reload(); }, [reload]));
  const canEdit = can(user, "content");
  let list: any[] = (data?.media ?? []).filter((m: any) => (!q || `${m.original_name} ${m.alt ?? ""}`.toLowerCase().includes(q.toLowerCase())) && (!type || m.mime === type || (type === "noalt" && !m.alt)));
  list = [...list].sort((a, b) => sort === "name" ? a.original_name.localeCompare(b.original_name) : sort === "size" ? b.size - a.size : sort === "old" ? a.id - b.id : b.id - a.id);
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
  const columns: Column<any>[] = [
    { key: "img", header: "Image", mobile: "title", render: (m) => <button type="button" className="flex items-center gap-3 text-left" onClick={() => setSel(m)}><img src={m.url} alt="" className="h-10 w-14 shrink-0 rounded-md bg-mist object-cover ring-1 ring-line" /><span className="min-w-0"><span className="block max-w-[16rem] truncate font-medium text-heading">{m.original_name}</span>{!m.alt && <span className="text-xs text-warn-fg">No alt text</span>}</span></button> },
    { key: "type", header: "Type", hideable: true, render: (m) => m.mime.replace("image/", "").toUpperCase() },
    { key: "dim", header: "Dimensions", hideable: true, render: (m) => m.width ? <span className="tnum">{m.width} × {m.height}</span> : "–" },
    { key: "size", header: "Size", hideable: true, render: (m) => <span className="tnum">{kb(m.size)}</span> },
    { key: "used", header: "Used in", hideable: true, render: (m) => m.used_in.length ? <Badge tone="info">{m.used_in.length} page{m.used_in.length > 1 ? "s" : ""}</Badge> : <span className="text-xs text-muted">Not used</span> },
    { key: "date", header: "Uploaded", hideable: true, render: (m) => <span className="text-xs">{fmtDay(m.created_at)}{m.uploaded_by && <span className="block text-muted">{m.uploaded_by}</span>}</span> },
    { key: "act", header: "", render: (m) => <Btn small onClick={() => setSel(m)}>Details</Btn> },
  ];
  return (
    <Page title="Media library" lead="Images used on the website. Each image needs alternative text describing it for screen-reader users and search engines."
      actions={canEdit && <Btn kind="primary" onClick={() => setShowUpload((v) => !v)}><Upload size={15} /> Upload</Btn>}>
      {canEdit && showUpload && <div className="mb-5"><Dropzone onFiles={async (f) => { const r = await up.start(f); if (r.length) notify(`${r.length} image${r.length > 1 ? "s" : ""} uploaded.`); }} />{up.view}</div>}
      <FilterBar actions={<div role="radiogroup" aria-label="View" className="inline-flex rounded-lg border border-line bg-surface p-0.5">{([["grid", LayoutGrid, "Grid"], ["list", List, "List"]] as const).map(([k, I, l]) => <button key={k} type="button" role="radio" aria-checked={view === k} aria-label={`${l} view`} onClick={() => setView(k)} className={`rounded-md p-1.5 ${view === k ? "bg-mist text-heading" : "text-muted hover:text-heading"}`}><I size={16} aria-hidden="true" /></button>)}</div>}>
        <div className="!min-w-[14rem] flex-[2]"><SearchInput value={q} onChange={setQ} placeholder="Search file names and alt text" /></div>
        <Field label="Type"><select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}><option value="">All images</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option><option value="image/gif">GIF</option><option value="noalt">Missing alt text</option></select></Field>
        <Field label="Sort"><select className={inputCls} value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest first</option><option value="old">Oldest first</option><option value="name">Name</option><option value="size">Largest first</option></select></Field>
      </FilterBar>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : loading && !data ? <Loading /> : !data.media.length ? (
        <Card><EmptyState icon={ImageIcon} title="No images uploaded yet" actions={canEdit && <Btn small kind="primary" onClick={() => setShowUpload(true)}><Upload size={13} /> Upload images</Btn>}>Uploaded images can be placed on any page with the Choose button on an image field.</EmptyState></Card>
      ) : view === "list" ? <DataTable id="media" caption="Media" columns={columns} rows={list.map((m) => ({ ...m }))} empty={<EmptyState compact icon={ImageIcon} title="No images match" />} /> : !list.length ? <Card><EmptyState compact icon={ImageIcon} title="No images match" /></Card> : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {list.map((m: any) => (
            <li key={m.id}><button type="button" onClick={() => setSel(m)} className="group block w-full overflow-hidden rounded-xl border border-line bg-surface text-left shadow-[var(--a-shadow-card)] transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_4px_12px_-4px_rgb(16_24_40/0.15)]">
              <span className="block aspect-[4/3] bg-mist"><img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" loading="lazy" /></span>
              <span className="block p-3"><span className="block truncate text-sm font-medium text-heading">{m.original_name}</span>
                <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted"><span className="tnum">{m.width ? `${m.width}×${m.height} · ` : ""}{kb(m.size)}</span>{m.used_in.length > 0 && <Badge tone="info">In use</Badge>}</span>
                {!m.alt && <span className="mt-1 inline-flex items-center gap-1 text-xs text-warn-fg"><AlertTriangle size={12} aria-hidden="true" />No alt text</span>}</span>
            </button></li>
          ))}
        </ul>
      )}
      {sel && <MediaDetails m={sel} canEdit={canEdit} canDelete={can(user, "delete")} onClose={() => setSel(null)} onChanged={() => { reload(); }} />}
    </Page>
  );
}

function MediaDetails({ m, canEdit, canDelete, onClose, onChanged }: { m: any; canEdit: boolean; canDelete: boolean; onClose: () => void; onChanged: () => void }) {
  const { notify } = useAdmin();
  const [alt, setAlt] = useState(m.alt ?? "");
  const abs = typeof window !== "undefined" ? `${window.location.origin}${m.url}` : m.url;
  return (
    <Modal open onClose={onClose} size="lg" title={m.original_name} description="Image details"
      footer={<>
        {canDelete && <Btn kind="danger" onClick={async () => {
          if (m.used_in.length) { notify(`This image is used in ${m.used_in.join(", ")}. Replace it there before deleting.`, "risk"); return; }
          if (!(await confirmDialog({ title: "Delete this image?", body: "It is removed from the media library and the server. This cannot be undone.", confirmLabel: "Delete image", danger: true }))) return;
          try { await api("DELETE", `/media/${m.id}`); notify("Image deleted."); onClose(); onChanged(); } catch (x) { notify(err(x), "risk"); }
        }}><Trash2 size={15} /> Delete</Btn>}
        <span className="flex-1" />
        <Btn href={m.url} target="_blank"><Download size={15} /> Download</Btn>
        <Btn onClick={() => { navigator.clipboard?.writeText(m.url); notify("Image address copied."); }}><Copy size={15} /> Copy address</Btn>
        {canEdit && <Btn kind="primary" disabled={alt === (m.alt ?? "")} onClick={async () => { try { await api("PATCH", `/media/${m.id}`, { alt }); notify("Alternative text saved."); onChanged(); onClose(); } catch (x) { notify(err(x), "risk"); } }}>Save</Btn>}
      </>}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-line bg-mist"><img src={m.url} alt={alt} className="max-h-80 w-full object-contain" /></div>
        <div className="space-y-4">
          <Field label="Alternative text" hint="Describe what the image shows, in one sentence. Leave empty only for purely decorative images." error={!alt ? "No alternative text yet" : null}>
            <textarea className={inputCls} rows={3} maxLength={300} value={alt} disabled={!canEdit} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          <DL rows={[["Type", m.mime], ["Dimensions", m.width ? `${m.width} × ${m.height} px` : "–"], ["File size", `${Math.round(m.size / 1024)} KB`], ["Uploaded", `${fmtDate(m.created_at)}${m.uploaded_by ? ` by ${m.uploaded_by}` : ""}`], ["Address", <code key="u" className="break-all text-xs">{abs}</code>],
            ["Used in", m.used_in.length ? <ul key="used" className="space-y-0.5">{m.used_in.map((k: string) => <li key={k}><a className="text-cobalt hover:underline" href={k.includes("article:") ? `#/articles/${k.replace(/^(nl:)?article:/, "$1")}` : `#/website/${enc(k)}`}>{k}</a></li>)}</ul> : "Not used on any page"]]} />
        </div>
      </div>
    </Modal>
  );
}
