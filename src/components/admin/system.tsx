/* eslint-disable @typescript-eslint/no-explicit-any -- admin views render loosely-typed API JSON */
"use client";

import { useState } from "react";
import { Copy, Download, KeyRound, Mail, MoreHorizontal, Play, RefreshCw, RotateCcw, ScrollText, Search, Send, ShieldOff, UserPlus, Users } from "lucide-react";
import { api, can, fmtDate, timeAgo } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, Card, DL, EmptyState, ErrorBox, Field, FilterBar, inputCls, Loading, Menu, MenuItem, MenuSep, Modal, Notice, Page, Pager, StatusBadge, Switch, Tabs, confirmDialog, promptDialog, useLoad } from "./ui";
import { DataTable, type Column } from "./datatable";

const err = (e: unknown) => (e as Error).message;

/* ------------------------------ Website settings ------------------------------ */
export function GeneralSettings() {
  const { notify } = useAdmin();
  const { data, error, loading, setData, reload } = useLoad(() => api("GET", "/settings"));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const s = data.settings; const set = (k: string, v: unknown) => { setData({ settings: { ...s, [k]: v } }); setDirty(true); };
  const num = (k: string, label: string, hint?: string) => <Field label={label} hint={hint}><input type="number" min={0} className={inputCls} value={s[k]} onChange={(e) => set(k, Number(e.target.value))} /></Field>;
  const sw = (k: string, label: string, hint?: string) => <Switch label={label} hint={hint} checked={!!s[k]} onChange={(v) => set(k, v)} />;
  const ls = s.lead_scoring;
  const save = async () => { setBusy(true); try { await api("PUT", "/settings", { settings: s }); notify("Settings saved."); setDirty(false); reload(); } catch (e) { notify(err(e), "risk"); } setBusy(false); };
  return (
    <Page title="Website settings" lead="Lead notifications, link lifetimes, abuse protection and lead qualification. Page text, navigation and footer are edited under Website management."
      actions={<Btn kind="primary" onClick={save} disabled={!dirty} busy={busy}>{dirty ? "Save changes" : "Saved"}</Btn>}>
      {dirty && <div className="sticky top-20 z-20 mb-4"><Notice tone="warn" title="Unsaved changes" actions={<Btn small kind="primary" onClick={save} busy={busy}>Save</Btn>}>Your changes are not active until you save.</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Lead notifications" lead="Notification emails never contain assessment findings.">
          <div className="space-y-3">
            <Field label="Send notifications to" hint="Separate several addresses with commas."><input className={inputCls} value={(s.notify_emails ?? []).join(", ")} onChange={(e) => set("notify_emails", e.target.value.split(/[,\s]+/).filter(Boolean))} /></Field>
            <div className="divide-y divide-line">{sw("notify_on_new_lead", "Every new lead")}{sw("notify_on_consultation", "Consultation requests")}{sw("notify_high_priority_only", "Only high-priority leads", "Limits the two options above to commercially high-priority leads.")}{sw("participant_emails", "Emails to participants", "Confirmation and report emails to people who take the assessment.")}</div>
          </div>
        </Card>
        <Card title="Links and abuse protection">
          <div className="grid gap-4 sm:grid-cols-2">{num("report_link_days", "PDF report links valid for (days)")}{num("result_link_days", "Results links valid for (days)")}{num("min_completion_seconds", "Minimum completion time (seconds)", "Faster submissions are treated as automated.")}</div>
          <div className="mt-3">{sw("track_steps", "Record anonymous step progress", "Used for the “where people stop” analytics. Stores no answers.")}</div>
        </Card>
        <Card title="Commercial lead qualification" lead="Points that set a lead's commercial priority. They never use the security maturity score." className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[["consultation", "Consultation requested"], ["report_only", "Report only"], ["per_interest", "Per service interest"], ["max_interest", "Interest points cap"], ["high", "High priority from"], ["medium", "Medium priority from"]].map(([k, l]) => <Field key={k} label={l}><input type="number" className={inputCls} value={ls[k]} onChange={(e) => set("lead_scoring", { ...ls, [k]: Number(e.target.value) })} /></Field>)}
          </div>
        </Card>
      </div>
    </Page>
  );
}

/* ---------------------------------- Users ---------------------------------- */
export function UsersPage() {
  const { user, notify, query } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/users"), []);
  const [add, setAdd] = useState(!!query.get("new"));
  const [n, setN] = useState({ email: "", name: "", role: "sales", password: "" });
  const [formErr, setFormErr] = useState<string | null>(null);
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const upd = async (id: number, b: any, msg = "User updated.") => { try { await api("PUT", `/users/${id}`, b); notify(msg); reload(); } catch (e) { notify(err(e), "risk"); } };
  const columns: Column<any>[] = [
    { key: "user", header: "User", mobile: "title", render: (u) => <div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-fg" aria-hidden="true">{u.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}</span><div className="min-w-0"><span className="font-medium text-heading">{u.name}{u.id === user.id && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}</span><span className="block truncate text-xs text-muted">{u.email}</span></div></div> },
    { key: "role", header: "Role", render: (u) => <select aria-label={`Role for ${u.name}`} className={`${inputCls} min-h-8 w-auto py-1 text-[0.8125rem] capitalize`} value={u.role} disabled={u.id === user.id} onChange={async (e) => { const r = e.target.value; if (await confirmDialog({ title: `Change ${u.name}'s role to ${r}?`, body: "They are signed out on other devices so the new permissions apply immediately.", confirmLabel: "Change role" })) upd(u.id, { role: r }, "Role changed."); else reload(); }}>{data.roles.map((r: string) => <option key={r} value={r}>{r}</option>)}</select> },
    { key: "status", header: "Status", render: (u) => !u.active ? <StatusBadge status="disabled" /> : u.locked_until && new Date(u.locked_until.replace(" ", "T") + "Z") > new Date() ? <Badge tone="risk" dot>Locked</Badge> : <StatusBadge status="active" /> },
    { key: "mfa", header: "Two-factor", render: (u) => u.mfa_enabled_at ? <Badge tone="ok" dot>Enabled</Badge> : <Badge tone="warn" dot>At next sign-in</Badge> },
    { key: "last", header: "Last sign-in", hideable: true, render: (u) => u.last_login_at ? <span title={fmtDate(u.last_login_at)}>{timeAgo(u.last_login_at)}</span> : <span className="text-muted">Never</span> },
    { key: "sessions", header: "Sessions", hideable: true, render: (u) => <span className="tnum">{u.sessions}</span> },
    { key: "act", header: "", render: (u) => u.id === user.id ? <Btn small href="#/account">My account</Btn> : (
      <Menu label={`Actions for ${u.name}`} width="w-60" trigger={({ open, toggle, id }) => <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} className="rounded-lg p-1.5 text-muted hover:bg-mist hover:text-heading" aria-label={`Actions for ${u.name}`}><MoreHorizontal size={18} /></button>}>
        {(close) => <>
          <MenuItem icon={KeyRound} onClick={async () => { close(); const p = await promptDialog({ title: `Set a new password for ${u.name}`, body: "They are signed out everywhere and use this password at their next sign-in.", confirmLabel: "Set password", input: { label: "New password", type: "password", minLength: 12, hint: "At least 12 characters." } }); if (p) upd(u.id, { password: p }, "Password reset."); }}>Reset password</MenuItem>
          {u.mfa_enabled_at && <MenuItem icon={RotateCcw} onClick={async () => { close(); if (await confirmDialog({ title: `Reset two-factor for ${u.name}?`, body: "They are signed out everywhere and scan a new QR code at their next sign-in. Only do this if they lost their phone and backup codes.", confirmLabel: "Reset two-factor", danger: true })) upd(u.id, { reset_2fa: true }, "Two-factor reset."); }}>Reset two-factor</MenuItem>}
          <MenuSep />
          <MenuItem icon={ShieldOff} danger={!!u.active} onClick={async () => { close(); if (await confirmDialog({ title: `${u.active ? "Disable" : "Enable"} ${u.name}?`, body: u.active ? "They are signed out immediately and cannot sign in until enabled again. Their history is kept." : "They can sign in again.", confirmLabel: u.active ? "Disable" : "Enable", danger: !!u.active })) upd(u.id, { active: !u.active }, u.active ? "User disabled." : "User enabled."); }}>{u.active ? "Disable account" : "Enable account"}</MenuItem>
        </>}
      </Menu>
    ) },
  ];
  return (
    <Page title="Users" lead="People who can sign in to the Command Centre. Every account must use two-factor sign-in."
      actions={<><Btn href="#/roles">Roles & permissions</Btn><Btn kind="primary" onClick={() => { setFormErr(null); setAdd(true); }}><UserPlus size={15} /> Add user</Btn></>}>
      <DataTable id="users" caption="Users" columns={columns} rows={loading && !data ? null : data.users} empty={<EmptyState compact icon={Users} title="No users" />} />
      <Modal open={add} onClose={() => setAdd(false)} title="Add a user" description="Share the temporary password with them securely. They set up two-factor sign-in the first time they sign in."
        footer={<><Btn onClick={() => setAdd(false)}>Cancel</Btn><Btn kind="primary" onClick={() => (document.getElementById("add-user") as HTMLFormElement)?.requestSubmit()}>Add user</Btn></>}>
        <form id="add-user" className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); try { await api("POST", "/users", n); setN({ email: "", name: "", role: "sales", password: "" }); setAdd(false); notify("User added."); reload(); } catch (x) { setFormErr(err(x)); } }}>
          {formErr && <div className="sm:col-span-2"><Notice tone="risk">{formErr}</Notice></div>}
          <Field label="Full name" required><input data-autofocus className={inputCls} required value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></Field>
          <Field label="Email" required><input type="email" className={inputCls} required value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} /></Field>
          <Field label="Role" hint="See Roles & permissions for what each role can do."><select className={`${inputCls} capitalize`} value={n.role} onChange={(e) => setN({ ...n, role: e.target.value })}>{(data?.roles ?? []).map((r: string) => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field label="Temporary password" required hint="At least 12 characters."><input type="password" autoComplete="new-password" minLength={12} className={inputCls} required value={n.password} onChange={(e) => setN({ ...n, password: e.target.value })} /></Field>
        </form>
      </Modal>
    </Page>
  );
}

/* ------------------------------ Email delivery ------------------------------ */
export function EmailsPage() {
  const { notify, refreshCounts } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/emails"));
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const list = (data?.emails ?? []).filter((m: any) => !status || m.status === status);
  const counts = { sent: 0, queued: 0, failed: 0 } as Record<string, number>;
  for (const m of data?.emails ?? []) counts[m.status] = (counts[m.status] ?? 0) + 1;
  const columns: Column<any>[] = [
    { key: "kind", header: "Email", mobile: "title", render: (m) => <div><span className="font-medium text-heading">{m.kind.replace(/_/g, " ")}</span>{m.lead_id && <a className="block text-xs text-cobalt hover:underline" href={`#/leads/${m.lead_id}`}>Open lead</a>}</div> },
    { key: "status", header: "Status", render: (m) => <StatusBadge status={m.status} /> },
    { key: "att", header: "Attempts", hideable: true, render: (m) => <span className="tnum">{m.attempts}</span> },
    { key: "created", header: "Queued", hideable: true, render: (m) => fmtDate(m.created_at) },
    { key: "sent", header: "Sent / next try", render: (m) => fmtDate(m.sent_at ?? m.next_attempt_at) },
    { key: "err", header: "Error", hideable: true, render: (m) => m.last_error ? <span className="block max-w-xs truncate text-xs text-risk-fg" title={m.last_error}>{m.last_error}</span> : <span className="text-muted">–</span> },
    { key: "act", header: "", render: (m) => m.status === "failed" && <Btn small onClick={async () => { await api("POST", `/emails/${m.id}/retry`, {}); notify("Queued for another attempt."); refreshCounts(); reload(); }}><RefreshCw size={13} /> Retry</Btn> },
  ];
  return (
    <Page title="Email delivery" lead="Every email the platform sends is queued and retried automatically. Contents are stored encrypted and not shown here."
      actions={<Btn onClick={async () => { const r = await api("POST", "/emails/process", {}); notify(`Queue processed: ${r.sent} sent, ${r.failed} failed.`); refreshCounts(); reload(); }}><Play size={15} /> Process queue now</Btn>}>
      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card title="Send a test email" lead="Checks that the configured delivery method works.">
          <form className="flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); try { const r = await api("POST", "/emails/test", { to }); notify(r.sent ? "Test email sent." : "Delivery failed; it is queued for retry.", r.sent ? "ok" : "risk"); reload(); } catch (x) { notify(err(x), "risk"); } }}>
            <input type="email" required aria-label="Recipient" className={`${inputCls} min-w-0 flex-1`} value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" /><Btn type="submit"><Send size={15} /> Send test</Btn>
          </form>
        </Card>
        <div className="grid grid-cols-3 gap-3">{(["sent", "queued", "failed"] as const).map((k) => <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(status === k ? "" : k)} className={`rounded-xl border bg-surface p-4 text-left shadow-[var(--a-shadow-card)] transition-colors ${status === k ? "border-brand" : "border-line hover:border-line-strong"}`}><p className="text-[0.8125rem] capitalize text-muted">{k}</p><p className={`tnum mt-1 text-2xl font-semibold ${k === "failed" && counts[k] ? "text-risk-fg" : "text-heading"}`}>{counts[k] ?? 0}</p></button>)}</div>
      </div>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : <DataTable id="emails" caption="Email queue" columns={columns} rows={loading && !data ? null : list} empty={<EmptyState icon={Mail} title={status ? `No ${status} emails` : "No emails yet"}>Lead notifications, sign-in alerts and participant emails will be listed here.</EmptyState>} />}
    </Page>
  );
}

/* ------------------------------ Privacy & retention ------------------------------ */
export function PrivacyPage() {
  const { user, notify } = useAdmin();
  const [email, setEmail] = useState(""); const [found, setFound] = useState<any[] | null>(null);
  const [last, setLast] = useState<Record<string, number> | null>(null);
  return (
    <Page title="Privacy & retention" lead="Handle data subject requests and control how long personal data is kept.">
      <div className="grid gap-6 xl:grid-cols-2">
        {can(user, "export") && (
          <Card title="Data subject request" lead="Find every lead for an email address to export (access request) or erase (erasure request).">
            <form className="flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); try { setFound((await api("POST", "/privacy/lookup", { email })).leads); } catch (x) { notify(err(x), "risk"); } }}>
              <input type="email" required aria-label="Email address" placeholder="person@company.nl" className={`${inputCls} min-w-0 flex-1`} value={email} onChange={(e) => setEmail(e.target.value)} /><Btn type="submit"><Search size={15} /> Find records</Btn>
            </form>
            {found && (found.length ? <ul className="mt-4 divide-y divide-line rounded-lg border border-line text-sm">{found.map((l) => <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-2"><span><a className="font-medium text-cobalt hover:underline" href={`#/leads/${l.id}`}>{l.public_ref}</a> <span className="text-muted">· {l.source} · {fmtDate(l.created_at)}</span></span><Btn small href={`#/leads/${l.id}`}><Download size={13} /> Export or erase</Btn></li>)}</ul>
              : <p className="mt-4 text-sm text-muted">No records found for this address.</p>)}
          </Card>
        )}
        <Card title="Data retention" lead="Runs automatically every day through the scheduled task.">
          <DL rows={[["Anonymous assessments", "365 days"], ["Leads (unless converted)", "730 days"], ["Assessment sessions", "180 days"], ["Audit log", "730 days"], ["Sent emails", "30 days"]]} />
          <p className="mt-3 text-xs text-muted">Retention periods are stored in the settings table (retention_days_*). Expired records are permanently deleted.</p>
          <div className="mt-4"><Btn onClick={async () => { if (!(await confirmDialog({ title: "Run data retention now?", body: "Records older than the retention periods are permanently deleted. This cannot be undone.", confirmLabel: "Run now", danger: true }))) return; const r = await api("POST", "/retention/run", {}); setLast(r); notify("Retention complete."); }}><Play size={15} /> Run retention now</Btn></div>
          {last && <div className="mt-4"><Notice tone="ok" title="Retention complete">{Object.entries(last).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" · ")}</Notice></div>}
        </Card>
      </div>
    </Page>
  );
}

/* --------------------------------- Audit log --------------------------------- */
const AUDIT_GROUPS: [string, string][] = [["", "All actions"], ["auth.", "Sign-in & security"], ["lead", "Leads"], ["content.", "Website content"], ["template.", "Assessment templates"], ["question.", "Questions"], ["media.", "Media"], ["user.", "Users"], ["settings.", "Settings"], ["report.", "Reports"], ["redirect.", "Redirects"]];
export function AuditPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const { data, error, loading, reload } = useLoad(() => api("GET", `/audit?page=${page}&size=50${action ? `&action=${encodeURIComponent(action)}` : ""}`), [page, action]);
  const columns: Column<any>[] = [
    { key: "when", header: "When", render: (e) => <span className="whitespace-nowrap" title={fmtDate(e.created_at)}>{fmtDate(e.created_at)}</span> },
    { key: "user", header: "User", mobile: "title", render: (e) => <span className="font-medium text-heading">{e.user_name ?? "System"}</span> },
    { key: "action", header: "Action", render: (e) => <code className={`rounded bg-mist px-1.5 py-0.5 text-xs ${/failed|denied/.test(e.action) ? "text-risk-fg" : "text-heading"}`}>{e.action}</code> },
    { key: "target", header: "Target", render: (e) => e.entity ? <span className="text-xs">{e.entity} {e.entity_id && `#${e.entity_id}`}</span> : <span className="text-muted">–</span> },
    { key: "meta", header: "Details", hideable: true, render: (e) => e.meta && Object.keys(e.meta).length ? <code className="block max-w-md truncate text-xs text-muted" title={JSON.stringify(e.meta)}>{JSON.stringify(e.meta)}</code> : null },
  ];
  return (
    <Page title="Audit log" lead="Every administrative action and sign-in, kept for 730 days. Personal data and security findings are not written to the log.">
      <FilterBar><Field label="Action type"><select className={inputCls} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>{AUDIT_GROUPS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field></FilterBar>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : <>
        <DataTable id="audit" caption="Audit log" columns={columns} rows={loading && !data ? null : data.entries} empty={<EmptyState compact icon={ScrollText} title="No entries" />} />
        {data && <Pager page={page} size={50} total={data.total} onPage={setPage} />}
      </>}
    </Page>
  );
}

/* --------------------------------- My account --------------------------------- */
export function AccountPage() {
  const { user, notify, query, theme, setTheme } = useAdmin();
  const [tab, setTab] = useState<"profile" | "mfa">(query.get("tab") === "mfa" ? "mfa" : "profile");
  const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const { data, reload } = useLoad(() => api("GET", "/mfa"));
  const [code, setCode] = useState(""); const [codes, setCodes] = useState<string[] | null>(null);
  return (
    <Page title="My account" lead={`${user.name} · ${user.email}`}>
      <Tabs label="Account sections" value={tab} onChange={setTab} tabs={[{ key: "profile", label: "Profile & password" }, { key: "mfa", label: "Two-factor & devices" }]} />
      {tab === "profile" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Profile"><DL rows={[["Name", user.name], ["Email", user.email], ["Role", <Badge key="r" tone="brand">{user.role}</Badge>]]} /><p className="mt-3 text-xs text-muted">Ask an owner to change your name, email or role.</p></Card>
          <Card title="Appearance" lead="Saved to your account and this browser.">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">{(["light", "dark", "system"] as const).map((t) => <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => setTheme(t)} className={`rounded-lg border px-3 py-3 text-sm font-medium capitalize transition-colors ${theme === t ? "border-brand bg-brand-50 text-brand-fg" : "border-line text-body hover:bg-mist"}`}>{t}</button>)}</div>
          </Card>
          <Card title="Change password" className="xl:col-span-2">
            <form className="grid max-w-3xl gap-4 sm:grid-cols-3 sm:items-start" onSubmit={async (e) => { e.preventDefault(); if (pw !== pw2) { notify("The new passwords do not match.", "risk"); return; } try { await api("POST", "/password", { current: cur, password: pw }); setCur(""); setPw(""); setPw2(""); notify("Password changed."); } catch (x) { notify(err(x), "risk"); } }}>
              <Field label="Current password"><input type="password" autoComplete="current-password" className={inputCls} required value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
              <Field label="New password" hint="At least 12 characters."><input type="password" autoComplete="new-password" minLength={12} className={inputCls} required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
              <Field label="Repeat new password" error={pw2 && pw !== pw2 ? "Does not match" : null}><input type="password" autoComplete="new-password" minLength={12} className={inputCls} required value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
              <div><Btn type="submit" kind="primary">Change password</Btn></div>
            </form>
          </Card>
        </div>
      ) : !data ? <Loading /> : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Two-factor sign-in" lead="Required for every account.">
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-3"><Badge tone="ok" dot>Enabled</Badge><span className="text-muted">since {fmtDate(data.enabled_at)}</span></div>
              <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3"><KeyRound size={18} className="text-muted" aria-hidden="true" /><p><span className="tnum font-semibold text-heading">{data.recovery_remaining} of 10</span> backup codes left{data.recovery_remaining <= 3 && <span className="text-warn-fg"> · create new codes soon</span>}</p></div>
              <form className="flex flex-wrap items-end gap-2" onSubmit={async (e) => { e.preventDefault(); try { const r = await api("POST", "/mfa/recovery-codes", { code }); setCodes(r.recovery_codes); setCode(""); reload(); } catch (x) { notify(err(x), "risk"); } }}>
                <Field label="Create new backup codes" hint="Enter a code from your authenticator app. Your old backup codes stop working."><input className={`${inputCls} w-40 font-mono tracking-widest`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))} /></Field>
                <Btn type="submit" disabled={code.length !== 6}>Create new codes</Btn>
              </form>
              {codes && <div className="rounded-lg border border-line bg-surface-2 p-4"><p className="font-semibold text-heading">Your new backup codes (shown once)</p><ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-heading">{codes.map((c) => <li key={c}>{c}</li>)}</ul><div className="mt-3"><Btn small onClick={() => { navigator.clipboard?.writeText(codes.join("\n")); notify("Copied."); }}><Copy size={13} /> Copy</Btn></div></div>}
            </div>
          </Card>
          <Card title="Trusted browsers" lead="Browsers that skip the code for 30 days.">
            {data.devices.length ? (
              <ul className="divide-y divide-line text-sm">{data.devices.map((d: any) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span><span className="font-medium text-heading">{d.label}</span>{d.current && <> <Badge tone="brand">This browser</Badge></>}<span className="block text-xs text-muted">Added {fmtDate(d.created_at)} · expires {fmtDate(d.expires_at)}</span></span>
                  <Btn small onClick={async () => { await api("DELETE", `/mfa/devices?id=${d.id}`); notify("Browser forgotten."); reload(); }}>Forget</Btn></li>))}
              </ul>
            ) : <p className="text-sm text-muted">No trusted browsers. Every sign-in asks for a code.</p>}
            {data.devices.length > 0 && <div className="mt-3"><Btn small kind="danger" onClick={async () => { if (!(await confirmDialog({ title: "Forget all trusted browsers?", body: "Every browser will ask for a code at the next sign-in.", confirmLabel: "Forget all", danger: true }))) return; await api("DELETE", "/mfa/devices"); notify("All trusted browsers forgotten."); reload(); }}>Forget all</Btn></div>}
            <p className="mt-4 text-xs text-muted">See all signed-in sessions in the <a className="text-cobalt underline" href="#/security">Security centre</a>.</p>
          </Card>
        </div>
      )}
    </Page>
  );
}
