/* eslint-disable @typescript-eslint/no-explicit-any -- operations views render loosely-typed API JSON */
"use client";

import { useState } from "react";
import { Activity, Bell, CheckCircle2, CircleDashed, CircleHelp, Clock, KeyRound, LogOut, MonitorSmartphone, RefreshCw, ShieldCheck, XCircle, AlertTriangle, MinusCircle, BookOpen } from "lucide-react";
import { api, can, fmtDate, timeAgo } from "./lib";
import { useAdmin } from "./ctx";
import { Badge, Btn, Card, EmptyState, ErrorBox, Loading, Notice, Page, Switch, Tabs, Table, Td, confirmDialog, useLoad, StatusBadge, DL } from "./ui";
import { EventIcon } from "./dashboard";

/* ------------------------------- Notifications ------------------------------- */
const NOTIF_LABELS: Record<string, [string, string]> = {
  lead: ["New leads", "Assessment leads, checklist and newsletter sign-ups"], consultation: ["Consultation requests", "Leads that asked to book a consultation"],
  enquiry: ["Contact enquiries", "Messages from the contact form"], assessment: ["Completed assessments", "Anonymous and identified completions"],
  email_failed: ["Failed email deliveries", "Only for roles that manage email"], security: ["Security events", "Failed sign-ins, backup code use and two-factor resets"],
};
export function NotificationsPage() {
  const { notify, refreshCounts, go } = useAdmin();
  const [tab, setTab] = useState<"all" | "unread" | "prefs">("all");
  const { data, error, loading, reload } = useLoad(() => api("GET", "/notifications"));
  const prefs = useLoad(() => api("GET", "/prefs"));
  const items = (data?.notifications ?? []).filter((n: any) => tab !== "unread" || !n.read);
  return (
    <Page title="Notifications" lead="Events from the last 30 days, generated from real records. Nothing here is sent by email."
      actions={data?.unread > 0 && <Btn onClick={async () => { await api("POST", "/notifications/read", { all: true }); notify("All notifications marked as read."); refreshCounts(); reload(); }}><CheckCircle2 size={15} /> Mark all as read</Btn>}>
      <Tabs label="Notification view" value={tab} onChange={setTab} tabs={[{ key: "all", label: "All", count: data?.notifications.length }, { key: "unread", label: "Unread", count: data?.unread }, { key: "prefs", label: "Preferences" }]} />
      {tab === "prefs" ? (
        <Card title="Which events notify me" lead="Applies to the bell and this page, for your account only.">
          {!prefs.data ? <Loading rows={2} /> : <div className="divide-y divide-line">{Object.entries(NOTIF_LABELS).map(([k, [l, h]]) => (
            <div key={k} className="py-2"><Switch label={l} hint={h} checked={prefs.data.prefs.notif_prefs[k] !== false} onChange={async (v) => {
              const next = { ...prefs.data.prefs.notif_prefs, [k]: v };
              prefs.setData({ prefs: { ...prefs.data.prefs, notif_prefs: next } });
              try { await api("PUT", "/prefs", { prefs: { notif_prefs: next } }); notify("Preference saved."); refreshCounts(); reload(); } catch (e) { notify((e as Error).message, "risk"); }
            }} /></div>
          ))}</div>}
        </Card>
      ) : error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : loading && !data ? <Loading /> : !items.length ? (
        <Card><EmptyState icon={Bell} title={tab === "unread" ? "You're all caught up" : "No notifications"}>{tab === "unread" ? "There are no unread notifications." : "New leads, consultation requests and completed assessments from the last 30 days appear here."}</EmptyState></Card>
      ) : (
        <Card pad={false}>
          <ul className="divide-y divide-line">
            {items.map((n: any) => (
              <li key={n.id}><button type="button" className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2 ${n.read ? "" : "bg-brand-50/40"}`}
                onClick={async () => { if (!n.read) { await api("POST", "/notifications/read", { ids: [n.id] }).catch(() => {}); refreshCounts(); } if (n.href) go(n.href); else reload(); }}>
                <EventIcon type={n.type} />
                <span className="min-w-0 flex-1"><span className={`block text-sm ${n.read ? "text-body" : "font-semibold text-heading"}`}>{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</span><span className="block truncate text-xs text-muted">{n.detail}</span></span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{!n.read && <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />}<time dateTime={n.at} title={fmtDate(n.at)}>{timeAgo(n.at)}</time></span>
              </button></li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}

/* -------------------------------- Activity -------------------------------- */
const ACT_FILTERS: [string, string][] = [["", "Everything"], ["lead,consultation,enquiry", "Leads & enquiries"], ["assessment", "Assessments"], ["audit", "Content & settings"], ["security", "Security"], ["email_failed", "Email failures"]];
export function ActivityPage() {
  const [type, setType] = useState("");
  const { data, error, loading, reload } = useLoad(() => api("GET", `/activity?limit=100${type ? `&type=${type}` : ""}`), [type]);
  const groups: Record<string, any[]> = {};
  for (const e of data?.events ?? []) { const d = new Date(e.at.replace(" ", "T") + "Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); (groups[d] ??= []).push(e); }
  return (
    <Page title="Activity centre" lead="A timeline of what happened across the platform: enquiries, assessments, content changes and administration. You only see events your role allows."
      actions={<Btn onClick={reload} busy={loading}>{!loading && <RefreshCw size={15} />} Refresh</Btn>}>
      <div className="mb-5 flex flex-wrap gap-1.5" role="group" aria-label="Filter activity">
        {ACT_FILTERS.map(([k, l]) => <button key={k} type="button" aria-pressed={type === k} onClick={() => setType(k)} className={`rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${type === k ? "border-heading bg-heading text-surface" : "border-line-strong text-body hover:bg-mist"}`}>{l}</button>)}
      </div>
      {error ? <ErrorBox onRetry={reload}>{error}</ErrorBox> : loading && !data ? <Loading /> : !data.events.length ? (
        <Card><EmptyState icon={Activity} title="No activity in the last 90 days">Events appear here as soon as leads arrive, assessments are completed or content is changed.</EmptyState></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([day, evs]) => (
            <section key={day}>
              <h2 className="mb-2 text-[0.8125rem] font-semibold text-muted">{day}</h2>
              <Card pad={false}>
                <ol className="divide-y divide-line">
                  {evs.map((e) => (
                    <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                      <EventIcon type={e.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-heading">{e.href ? <a href={`#/${e.href}`} className="font-medium hover:underline">{e.title}</a> : <span className="font-medium">{e.title}</span>}</p>
                        <p className="truncate text-xs text-muted">{[e.detail, e.actor].filter(Boolean).join(" · ")}</p>
                      </div>
                      <time className="shrink-0 text-xs text-muted" dateTime={e.at} title={fmtDate(e.at)}>{new Date(e.at.replace(" ", "T") + "Z").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

/* ------------------------------ Security centre ------------------------------ */
const CHECK_UI: Record<string, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  pass: { icon: CheckCircle2, cls: "text-ok-fg", label: "Pass" }, ok: { icon: CheckCircle2, cls: "text-ok-fg", label: "Healthy" },
  warn: { icon: AlertTriangle, cls: "text-warn-fg", label: "Attention" }, fail: { icon: XCircle, cls: "text-risk-fg", label: "Failing" },
  info: { icon: CircleHelp, cls: "text-info-fg", label: "Info" }, unknown: { icon: CircleDashed, cls: "text-muted", label: "Not checked" }, not_available: { icon: MinusCircle, cls: "text-muted", label: "Not available" },
};
function CheckRow({ c }: { c: any }) {
  const u = CHECK_UI[c.status] ?? CHECK_UI.unknown;
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <u.icon size={18} className={`mt-0.5 shrink-0 ${u.cls}`} aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="text-sm font-medium text-heading">{c.label}</p><p className="mt-0.5 text-[0.8125rem] text-muted">{c.detail}</p>
        {(c.latency_ms !== undefined || c.last_ok) && <p className="mt-1 text-xs text-muted">{c.latency_ms !== undefined && `Response ${c.latency_ms} ms`}{c.latency_ms !== undefined && c.last_ok && " · "}{c.last_ok && `Last success ${fmtDate(c.last_ok)}`}</p>}</div>
      <span className={`shrink-0 text-xs font-semibold ${u.cls}`}>{u.label}</span>
    </li>
  );
}

export function SecurityCentre() {
  const { user, notify } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api("GET", "/security"));
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const s = data.stats;
  const passing = data.checks.filter((c: any) => c.status === "pass").length;
  const stat = (label: string, v: number, tone?: "risk") => <div className="rounded-xl border border-line bg-surface p-4 shadow-[var(--a-shadow-card)]"><p className="text-[0.8125rem] text-muted">{label}</p><p className={`tnum mt-1 text-2xl font-semibold ${tone && v > 0 ? "text-risk-fg" : "text-heading"}`}>{v}</p></div>;
  return (
    <Page title="Security centre" lead={data.scope === "all" ? "Sign-in activity, sessions, two-factor status and configuration checks for every admin account. All values come from the application's own records." : "Your sign-in activity and sessions. Owners and admins see every account."}
      actions={<Btn onClick={reload}><RefreshCw size={15} /> Refresh</Btn>}>
      {data.recommendations.length > 0 && <div className="mb-6"><Notice tone="warn" title="Recommendations"><ul className="mt-1 list-disc space-y-1 pl-5">{data.recommendations.map((r: string) => <li key={r}>{r}</li>)}</ul></Notice></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stat("Successful sign-ins (30 days)", s.logins_30d)}{stat("Failed sign-ins (30 days)", s.failed_30d, "risk")}{stat("Failed sign-ins (24 hours)", s.failed_24h, "risk")}
        {stat("Permission denials (30 days)", s.denied_30d, "risk")}{stat("Backup codes used (30 days)", s.recovery_used_30d)}{stat("Two-factor resets (30 days)", s.mfa_resets_30d)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Configuration checks" lead={`${passing} of ${data.checks.length} passing. “Not checked” means the application cannot verify it.`} pad={false}>
          <ul className="divide-y divide-line">{data.checks.map((c: any) => <CheckRow key={c.key} c={c} />)}</ul>
        </Card>
        <Card title="Active sessions" lead="Signed-in browsers. Signing one out ends it immediately." pad={false}>
          {!data.sessions.length ? <EmptyState compact icon={MonitorSmartphone} title="No active sessions" /> : (
            <ul className="divide-y divide-line">
              {data.sessions.map((x: any) => (
                <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <MonitorSmartphone size={18} className="shrink-0 text-muted" aria-hidden="true" />
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-heading">{x.label}{x.current && <> <Badge tone="brand">This browser</Badge></>}</p><p className="text-xs text-muted">{data.scope === "all" && `${x.user} · `}Signed in {fmtDate(x.created_at)} · active {timeAgo(x.last_seen_at)}</p></div>
                  {(x.user_id === user.id || can(user, "users")) && <Btn small kind="danger" onClick={async () => {
                    if (!(await confirmDialog({ title: x.current ? "Sign out this browser?" : `Sign out ${x.user} on ${x.label}?`, body: x.current ? "You will be returned to the sign-in screen." : "That browser will need to sign in again.", confirmLabel: "Sign out", danger: true }))) return;
                    try { const r = await api("DELETE", `/sessions/${x.id}`); if (r.self) { window.dispatchEvent(new Event("bk-admin-logout")); return; } notify("Session signed out."); reload(); } catch (e) { notify((e as Error).message, "risk"); }
                  }}><LogOut size={13} /> Sign out</Btn>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {data.users && (
        <div className="mt-6">
          <h2 className="mb-3 text-[1.0625rem] font-semibold text-heading">Account protection</h2>
          <Table head={["User", "Role", "Two-factor", "Last sign-in", "State"]}>
            {data.users.map((u: any) => <tr key={u.id}><Td><span className="font-medium text-heading">{u.name}</span><span className="block text-xs text-muted">{u.email}</span></Td><Td className="capitalize">{u.role}</Td>
              <Td>{u.mfa_enabled_at ? <Badge tone="ok" dot>On since {fmtDate(u.mfa_enabled_at).slice(0, 11)}</Badge> : <Badge tone="warn" dot>Set up at next sign-in</Badge>}</Td><Td>{u.last_login_at ? timeAgo(u.last_login_at) : "Never"}</Td>
              <Td>{!u.active ? <StatusBadge status="disabled" /> : u.locked ? <Badge tone="risk" dot>Locked</Badge> : <StatusBadge status="active" />}</Td></tr>)}
          </Table>
        </div>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Authentication events" lead="Last 30 days, newest first." pad={false}>
          {!data.events.length ? <EmptyState compact icon={KeyRound} title="No sign-in events" /> : (
            <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto" tabIndex={0} aria-label="Authentication events">
              {data.events.map((e: any) => (
                <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
                  {e.failed ? <XCircle size={16} className="mt-0.5 shrink-0 text-risk-fg" aria-label="Failed" /> : <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok-fg" aria-label="Succeeded" />}
                  <div className="min-w-0 flex-1"><p className="text-sm text-heading">{e.label} <span className="text-muted">· {e.user}</span></p><p className="text-xs text-muted">{[e.how && `via ${String(e.how).replace(/_/g, " ")}`, e.device, e.path].filter(Boolean).join(" · ")}</p></div>
                  <time className="shrink-0 text-xs text-muted" dateTime={e.at} title={fmtDate(e.at)}>{timeAgo(e.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {data.permission_changes && <Card title="Recent permission changes" pad={false}>
          {!data.permission_changes.length ? <EmptyState compact icon={Clock} title="No changes recorded" /> : (
            <ul className="divide-y divide-line">{data.permission_changes.map((p: any) => <li key={p.id} className="px-5 py-2.5"><p className="text-sm text-heading">{p.action === "user.create" ? "User added" : p.action === "auth.mfa_reset" ? "Two-factor reset" : "User changed"}: <span className="font-medium">{p.target}</span></p><p className="text-xs text-muted">by {p.by} · {fmtDate(p.at)}{p.fields?.length ? ` · ${p.fields.join(", ")}` : ""}</p></li>)}</ul>
          )}
        </Card>}
      </div>
    </Page>
  );
}

/* -------------------------------- System health -------------------------------- */
export function SystemHealth() {
  const { data, error, loading, reload } = useLoad(() => api("GET", "/health"));
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const worst = data.checks.some((c: any) => c.status === "fail") ? "fail" : data.checks.some((c: any) => c.status === "warn") ? "warn" : "ok";
  return (
    <Page title="System health" lead="Live checks run when you open this page. Services the application cannot check are shown as not checked, never as healthy."
      meta={<span>Checked {fmtDate(data.checked_at)}</span>}
      actions={<Btn onClick={reload} busy={loading}>{!loading && <RefreshCw size={15} />} Run checks again</Btn>}>
      <div className="mb-6"><Notice tone={worst === "ok" ? "ok" : worst === "warn" ? "warn" : "risk"} title={worst === "ok" ? "All checked services are working" : worst === "warn" ? "Some services need attention" : "A service is failing"} /></div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Service status" pad={false}><ul className="divide-y divide-line">{data.checks.map((c: any) => <CheckRow key={c.key} c={c} />)}</ul></Card>
        <div className="space-y-6">
          <Card title="Recent operational failures"><DL rows={[["Failed emails (7 days)", <span key="e" className={data.failures.emails_failed_7d ? "font-semibold text-risk-fg" : ""}>{data.failures.emails_failed_7d}</span>], ["Permission denials (7 days)", data.failures.denied_7d]]} /></Card>
          <Card title="System information"><DL rows={[["Node.js", data.info.node], ["Mode", data.info.mode], ["Running since", fmtDate(data.info.started_at)], ["Leads", data.info.records.leads], ["Assessments", data.info.records.assessments], ["Users", data.info.records.users], ["Edited content documents", data.info.records.content_docs], ["Audit log entries", data.info.records.audit_entries]]} /></Card>
        </div>
      </div>
    </Page>
  );
}

/* ------------------------------ Roles & permissions ------------------------------ */
const CAP_LABELS: Record<string, string> = { view: "Sign in and view dashboards and content", content: "Edit website content and assessments", publish: "Publish and unpublish assessments", assessments: "See completed assessment results", leads: "See and manage leads (personal data)", reports: "Create and revoke report links", export: "Export data (CSV, GDPR exports)", delete: "Delete records permanently", settings: "Change settings, email and retention", audit: "Read the audit log", users: "Manage users and roles" };
const ROLE_DESC: Record<string, string> = { owner: "Full control, including users", admin: "Everything except managing users", editor: "Website and assessment content; no personal data", sales: "Leads, results and reports", viewer: "Read-only dashboards and content" };
export function RolesPage() {
  const { data, error, loading } = useLoad(() => api("GET", "/roles"));
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox>{error}</ErrorBox>;
  return (
    <Page title="Roles & permissions" lead="Permissions are enforced on the server for every request. Hiding a menu item is never the only protection.">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{data.roles.map((r: string) => <div key={r} className="rounded-xl border border-line bg-surface p-4 shadow-[var(--a-shadow-card)]"><p className="font-semibold capitalize text-heading">{r}</p><p className="mt-1 text-[0.8125rem] text-muted">{ROLE_DESC[r]}</p></div>)}</div>
      <Table head={["Permission", ...data.roles.map((r: string) => <span key={r} className="capitalize">{r}</span>)]} minWidth={760}>
        {Object.entries(data.caps).map(([cap, roles]: any) => (
          <tr key={cap}><Td><span className="font-medium text-heading">{CAP_LABELS[cap] ?? cap}</span><span className="block font-mono text-xs text-muted">{cap}</span></Td>
            {data.roles.map((r: string) => <Td key={r}>{roles.includes(r) ? <CheckCircle2 size={18} className="text-ok-fg" aria-label="Allowed" /> : <MinusCircle size={18} className="text-muted/50" aria-label="Not allowed" />}</Td>)}</tr>
        ))}
      </Table>
      <p className="mt-3 text-xs text-muted">Roles are fixed in code so they cannot be widened by accident. Change a person&apos;s role under Users.</p>
    </Page>
  );
}

/* ------------------------------ Administrator guide ------------------------------ */
const GUIDE: [string, string[]][] = [
  ["Daily routine", ["Open the Overview. “Needs attention” lists anything waiting: consultation requests, overdue follow-ups, failed emails and failed sign-ins.", "Open Lead pipeline and move leads along as you contact them. Use Mark contacted on a lead to record the contact date.", "Set a next follow-up date on any lead you need to call back; it appears under Follow-ups when due."]],
  ["Editing the website", ["Website management → Pages lists every page in English and Dutch. Edit the text, links, images and SEO fields, then Save and publish. Changes are live immediately.", "Every save is kept as a revision. Use Revisions to restore an earlier version, or Reset to original to go back to the built-in text.", "Links in text use [link text](/page). Bold uses **text**. Scripts and raw HTML are not allowed, so the design cannot break."]],
  ["Articles and images", ["Insights & articles → New article. Leave the status on draft until it is ready; drafts are hidden from the website.", "Upload images in the Media library and add alternative text describing each image. Images that are in use cannot be deleted."]],
  ["SEO", ["SEO overview shows pages with missing or duplicate titles and descriptions and links to pages that do not exist. These are internal checks; search rankings come from Google Search Console, which is not connected here.", "When you rename or remove a page, add a URL redirect so old links keep working."]],
  ["Assessments", ["Assessment templates hold the questions and scoring for each assessment. Publishing creates a new version; completed results always keep the version they were taken with.", "Question weights, scoring thresholds and recommendation rules are under the Cybersecurity assessments group."]],
  ["Security", ["Every account uses two-factor sign-in. Keep your backup codes somewhere safe (My account).", "Security centre shows sign-in activity and lets you sign out any browser. Add a second owner account so you are not locked out if you lose your phone.", "If the only owner loses their phone and backup codes, run on the server: node backend/dist/cli.js reset-2fa --email you@example.com"]],
  ["Privacy", ["Privacy & retention finds every record for an email address so you can export or erase it (GDPR requests).", "Old records are deleted automatically by the daily retention job; System health shows when it last ran."]],
];
export function GuidePage() {
  return (
    <Page title="Administrator guide" lead="How to run the BlazeKonzult Command Centre day to day. Press ⌘K (Ctrl K on Windows) anywhere to search or jump to a page.">
      <div className="grid gap-6 lg:grid-cols-2">
        {GUIDE.map(([title, items]) => (
          <Card key={title} title={<span className="flex items-center gap-2"><BookOpen size={16} className="text-brand-fg" aria-hidden="true" />{title}</span>}>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-body">{items.map((t) => <li key={t}>{t}</li>)}</ol>
          </Card>
        ))}
      </div>
    </Page>
  );
}
