"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminCtx, type Counts, type Theme } from "./ctx";
import { api, parseRoute, setCsrf, type User } from "./lib";
import { DialogHost, ErrorBox, Loading, Toaster, EmptyState } from "./ui";
import { AdminLayout } from "./shell";
import Login from "./Login";
import { Dashboard } from "./dashboard";
import { LeadsView, Pipeline, LeadWorkspace } from "./crm";
import { Assessments, AssessmentDetail, Reports, Analytics as AssessmentAnalytics } from "./data";
import { Templates, TemplateDetail, Questions, Categories, Scoring, Rules } from "./content";
import { GeneralSettings, UsersPage, EmailsPage, PrivacyPage, AuditPage, AccountPage } from "./system";
import { WebsitePages, Articles, MediaLibrary } from "./website";
import { NotificationsPage, ActivityPage, SecurityCentre, SystemHealth, RolesPage, GuidePage } from "./ops";
import { SeoOverview, RedirectsPage, LocalizationPage } from "./seo";
import { BusinessAnalytics } from "./analytics";
import { NAV } from "./nav";
import { can } from "./lib";
import { ShieldOff } from "lucide-react";

const THEME_KEY = "bk-admin-theme";
const SIDEBAR_KEY = "bk-admin-sidebar";

function applyTheme(t: Theme) {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.adminTheme = dark ? "dark" : "light";
}

function useHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const on = () => { setHash(window.location.hash); document.getElementById("admin-main")?.scrollTo?.(0, 0); window.scrollTo(0, 0); };
    on();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

/** Minimum capability per route (server enforces it too; this avoids showing a broken screen). */
const ROUTE_CAP: Record<string, string> = Object.fromEntries(NAV.flatMap((g) => g.items.map((i) => [i.id, i.cap])));

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [theme, setThemeState] = useState<Theme>("system");
  const [collapsed, setCollapsedState] = useState(false);
  const [counts, setCounts] = useState<Counts>({});
  const notifyRef = useRef<(t: string, tone?: "ok" | "risk" | "info") => void>(() => {});
  const hash = useHash();

  useEffect(() => {
    try {
      const t = (localStorage.getItem(THEME_KEY) as Theme) || "system";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore preferences after hydration
      setThemeState(t); applyTheme(t);
      setCollapsedState(localStorage.getItem(SIDEBAR_KEY) === "collapsed");
    } catch { applyTheme("system"); }
    api<{ user: User; csrf: string }>("GET", "/me").then((r) => { setCsrf(r.csrf); setUser(r.user); }).catch(() => {}).finally(() => setChecked(true));
    const out = () => setUser(null);
    window.addEventListener("bk-admin-logout", out);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => { try { if ((localStorage.getItem(THEME_KEY) ?? "system") === "system") applyTheme("system"); } catch { applyTheme("system"); } };
    mq.addEventListener("change", onMq);
    return () => { window.removeEventListener("bk-admin-logout", out); mq.removeEventListener("change", onMq); };
  }, []);

  // Server-side preferences follow the user across devices.
  useEffect(() => {
    if (!user) return;
    api("GET", "/prefs").then((r) => {
      const p = r.prefs;
      let local: string | null = null; try { local = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
      if (!local && p.theme) { setThemeState(p.theme); applyTheme(p.theme); }
      if (p.sidebar) setCollapsedState(p.sidebar === "collapsed");
    }).catch(() => {});
  }, [user]);

  // One-off messages set before sign-in completed (for example, few backup codes left).
  useEffect(() => { if (!user) return; try { const f = sessionStorage.getItem("bk-admin-flash"); if (f) { sessionStorage.removeItem("bk-admin-flash"); setTimeout(() => notifyRef.current(f, "info"), 300); } } catch { /* ignore */ } }, [user]);

  const refreshCounts = useCallback(() => { api("GET", "/counts").then((r) => setCounts(r.counts)).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) return;
    refreshCounts();
    const t = setInterval(() => { if (document.visibilityState === "visible") refreshCounts(); }, 60_000);
    return () => clearInterval(t);
  }, [user, refreshCounts]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t); applyTheme(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
    api("PUT", "/prefs", { prefs: { theme: t } }).catch(() => {});
  }, []);
  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem(SIDEBAR_KEY, v ? "collapsed" : "expanded"); } catch { /* ignore */ }
    api("PUT", "/prefs", { prefs: { sidebar: v ? "collapsed" : "expanded" } }).catch(() => {});
  }, []);
  const notify = useCallback((text: string, tone: "ok" | "risk" | "info" = "ok") => notifyRef.current(text, tone), []);
  const bindToast = useCallback((fn: (t: string, tone?: "ok" | "risk" | "info") => void) => { notifyRef.current = fn; }, []);
  const go = useCallback((h: string) => { window.location.hash = `/${h.replace(/^#?\/?/, "")}`; }, []);
  const signOut = useCallback(async () => { await api("POST", "/logout", {}).catch(() => {}); setUser(null); }, []);

  if (!checked) return <div className="admin-root grid min-h-screen place-items-center"><div className="w-full max-w-3xl px-6"><Loading /></div></div>;
  if (!user) return <div className="admin-root"><Login onLogin={(u, c) => { setCsrf(c); setUser(u); }} /></div>;

  const { section, id, query } = parseRoute(hash);
  const cap = ROUTE_CAP[section];
  let view: React.ReactNode; let crumb: string | undefined;
  if (cap && !can(user, cap)) {
    view = <EmptyState icon={ShieldOff} title="You don't have access to this area" actions={<a className="text-sm font-semibold text-cobalt" href="#/overview">Back to the overview</a>}>Your role ({user.role}) does not include this permission. Ask an owner if you need access.</EmptyState>;
  } else switch (section) {
    case "overview": view = <Dashboard />; break;
    case "analytics": view = <BusinessAnalytics />; break;
    case "activity": view = <ActivityPage />; break;
    case "notifications": view = <NotificationsPage />; break;
    case "leads": if (id) { view = <LeadWorkspace id={Number(id)} />; crumb = "Lead"; } else view = <LeadsView variant="all" />; break;
    case "consultations": view = <LeadsView variant="consultations" />; break;
    case "enquiries": view = <LeadsView variant="enquiries" />; break;
    case "follow-ups": view = <LeadsView variant="follow-ups" />; break;
    case "pipeline": view = <Pipeline />; break;
    case "assessments": view = id ? <AssessmentDetail id={Number(id)} /> : <Assessments />; if (id) crumb = "Result"; break;
    case "reports": view = <Reports />; break;
    case "assessment-analytics": view = <AssessmentAnalytics />; break;
    case "templates": view = id ? <TemplateDetail id={Number(id)} /> : <Templates />; if (id) crumb = "Builder"; break;
    case "questions": view = <Questions />; break;
    case "categories": view = <Categories />; break;
    case "scoring": view = <Scoring />; break;
    case "rules": view = <Rules />; break;
    case "website": view = <WebsitePages docKey={id} group={query.get("group") ?? undefined} />; break;
    case "articles": view = <Articles slug={id} />; break;
    case "media": view = <MediaLibrary />; break;
    case "seo": view = <SeoOverview />; break;
    case "redirects": view = <RedirectsPage />; break;
    case "localization": view = <LocalizationPage />; break;
    case "users": view = <UsersPage />; break;
    case "roles": view = <RolesPage />; break;
    case "security": view = <SecurityCentre />; break;
    case "audit": view = <AuditPage />; break;
    case "emails": view = <EmailsPage />; break;
    case "settings": view = <GeneralSettings />; break;
    case "privacy": view = <PrivacyPage />; break;
    case "health": view = <SystemHealth />; break;
    case "guide": view = <GuidePage />; break;
    case "account": view = <AccountPage />; break;
    default: view = <ErrorBox>That page does not exist. <a className="underline" href="#/overview">Go to the overview</a>.</ErrorBox>;
  }

  return (
    <div className="admin-root">
      <Toaster bind={bindToast}>
        <AdminCtx.Provider value={{ user, notify, go, counts, refreshCounts, theme, setTheme, query }}>
          <AdminLayout user={user} section={section} id={id} crumb={crumb} collapsed={collapsed} setCollapsed={setCollapsed} onSignOut={signOut}>
            <div key={`${section}/${id ?? ""}`}>{view}</div>
          </AdminLayout>
          <DialogHost />
        </AdminCtx.Provider>
      </Toaster>
    </div>
  );
}
