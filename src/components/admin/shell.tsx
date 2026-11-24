/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element -- loosely-typed API JSON; the logo is a static SVG */
"use client";

/** AdminLayout: sidebar, top bar, breadcrumbs, command palette, notifications, account menu. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell, Check, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, CornerDownLeft, ExternalLink, FilePlus2, ImagePlus, ListPlus, LogOut, Menu as MenuIcon, Monitor, Moon,
  Newspaper, Plus, Search, Sun, Users, X, LayoutDashboard, Settings, type LucideIcon,
} from "lucide-react";
import { api, can, timeAgo, type User } from "./lib";
import { useAdmin, type Theme } from "./ctx";
import { ACCOUNT_LINKS, NAV, ROUTE_LABELS, type NavItem } from "./nav";
import { Badge, IconBtn, Menu, MenuItem, MenuSep, useDebounced } from "./ui";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
const LS_GROUPS = "bk-admin-groups";

function Logo({ compact }: { compact?: boolean }) {
  return (
    <a href="#/overview" className="flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1" title="Overview">
      <img src="/icon.svg" alt={compact ? "BlazeKonzult Command Centre" : ""} width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg" />
      {!compact && <span className="min-w-0 leading-tight">
        <span className="block truncate text-[0.9375rem] font-semibold text-white">Blaze<span className="text-[#b39dfa]">Konzult</span></span>
        <span className="block truncate text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-sb-muted">Command Centre</span>
      </span>}
    </a>
  );
}

/* --------------------------------- Sidebar --------------------------------- */
function Sidebar({ section, collapsed, onToggle, mobile, onClose, onSignOut }: { section: string; collapsed: boolean; onToggle?: () => void; mobile?: boolean; onClose?: () => void; onSignOut: () => void }) {
  const { user, counts } = useAdmin();
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- restore remembered group state after hydration
  useEffect(() => { try { setClosedGroups(JSON.parse(localStorage.getItem(LS_GROUPS) ?? "[]")); } catch { /* ignore */ } }, []);
  const toggleGroup = (k: string) => setClosedGroups((g) => { const n = g.includes(k) ? g.filter((x) => x !== k) : [...g, k]; try { localStorage.setItem(LS_GROUPS, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const isActive = (it: NavItem) => {
    if (it.external) return false;
    const h = it.href.replace(/^#\//, "");
    if (h.includes("/") || h.includes("?")) return decodeURIComponent(hash.replace(/^#\/?/, "")) === decodeURIComponent(h);
    if (it.id === "website") return section === "website" && !/website\/(page%3Ahome|page:home|site)|group=/.test(hash);
    if (it.id === "leads") return section === "leads";
    return section === it.id;
  };
  const c = collapsed && !mobile;
  return (
    <aside aria-label="Main navigation" className={`a-sidebar flex h-full flex-col bg-sb text-sb-text ${mobile ? "w-[17.5rem]" : c ? "w-[4.5rem]" : "w-[16.5rem]"}`}>
      <div className={`flex h-16 shrink-0 items-center border-b border-sb-line ${c ? "justify-center px-2" : "justify-between px-4"}`}>
        <Logo compact={c} />
        {mobile && <button onClick={onClose} className="rounded-lg p-2 text-sb-muted hover:bg-sb-2 hover:text-white" aria-label="Close navigation"><X size={18} /></button>}
      </div>
      {!c && <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-sb-line bg-sb-2 px-3 py-2 text-xs">
        <span className="h-2 w-2 rounded-full bg-[#3ccb7f]" aria-hidden="true" /><span className="truncate text-sb-text">blazekonzult.nl</span><span className="ml-auto text-sb-muted">Workspace</span>
      </div>}
      <nav className="a-scroll mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => {
          const items = g.items.filter((it) => can(user, it.cap));
          if (!items.length) return null;
          const closed = g.collapsible && closedGroups.includes(g.key) && !items.some(isActive);
          return (
            <div key={g.key} className="mt-4 first:mt-2">
              {c ? <div className="mx-2 mb-2 h-px bg-sb-line" aria-hidden="true" /> : g.collapsible ? (
                <button type="button" onClick={() => toggleGroup(g.key)} aria-expanded={!closed} className="mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-sb-muted hover:text-sb-text">
                  {g.label}<ChevronDown size={14} className={`transition-transform ${closed ? "-rotate-90" : ""}`} aria-hidden="true" />
                </button>
              ) : <p className="mb-1 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-sb-muted">{g.label}</p>}
              {!closed && <ul className="space-y-0.5">
                {items.map((it) => {
                  const on = isActive(it); const n = it.badge ? counts[it.badge] : null;
                  return (
                    <li key={it.id} className="group relative">
                      <a href={it.href} target={it.external ? "_blank" : undefined} rel={it.external ? "noopener" : undefined} aria-current={on ? "page" : undefined} onClick={mobile ? onClose : undefined}
                        className={`relative flex min-h-9 items-center gap-3 rounded-lg px-2.5 text-[0.875rem] transition-colors ${c ? "justify-center" : ""} ${on ? "bg-[#6d3bea]/20 font-medium text-white" : "text-sb-text hover:bg-sb-2 hover:text-white"}`}>
                        {on && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#8b63f5]" aria-hidden="true" />}
                        <it.icon size={18} className={`shrink-0 ${on ? "text-[#c4b5fd]" : "text-sb-muted group-hover:text-sb-text"}`} aria-hidden="true" />
                        {!c && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                        {!c && it.external && <ExternalLink size={13} className="text-sb-muted" aria-hidden="true" />}
                        {n ? (c ? <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${it.badgeTone === "risk" ? "bg-[#f97066]" : "bg-[#9b7bf7]"}`} aria-label={`${n} new`} />
                          : <span className={`tnum rounded-full px-1.5 py-px text-[0.6875rem] font-semibold ${it.badgeTone === "risk" ? "bg-[#f97066]/20 text-[#fda29b]" : "bg-[#6d3bea]/30 text-[#d9ceff]"}`}><span className="sr-only">, </span>{n > 99 ? "99+" : n}<span className="sr-only"> new</span></span>) : null}
                      </a>
                      {c && <span role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#101828] px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{it.label}{n ? ` (${n})` : ""}</span>}
                    </li>
                  );
                })}
              </ul>}
            </div>
          );
        })}
      </nav>
      <div className={`shrink-0 border-t border-sb-line p-3 ${c ? "flex flex-col items-center gap-2" : ""}`}>
        <div className={`flex items-center gap-3 rounded-lg ${c ? "" : "px-2 py-1.5"}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6d3bea] to-[#1d4ed8] text-sm font-semibold text-white" aria-hidden="true">{initials(user.name)}</span>
          {!c && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{user.name}</p><p className="truncate text-xs capitalize text-sb-muted">{user.role}</p></div>}
          {!c && <button onClick={onSignOut} className="rounded-lg p-2 text-sb-muted hover:bg-sb-2 hover:text-white" aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>}
        </div>
        {onToggle && !mobile && (
          <button onClick={onToggle} className={`mt-1 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-sb-muted hover:bg-sb-2 hover:text-white ${c ? "" : "w-full"}`} aria-label={c ? "Expand sidebar" : "Collapse sidebar"} title={c ? "Expand sidebar" : "Collapse sidebar"}>
            {c ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
          </button>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------- Breadcrumbs ------------------------------- */
export function Breadcrumbs({ section, id, extra }: { section: string; id?: string; extra?: string }) {
  const info = ROUTE_LABELS[section] ?? { label: section, group: "" };
  const crumbs: { label: string; href?: string }[] = [];
  if (info.group) crumbs.push({ label: info.group });
  crumbs.push({ label: info.label, href: id ? `#/${section}` : undefined });
  if (id) crumbs.push({ label: extra ?? (section === "website" ? (id.startsWith("nl:") ? "Dutch version" : "Edit") : section === "articles" ? "Edit article" : `#${id}`) });
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[0.8125rem]">
        {crumbs.map((c, i) => (
          <li key={i} className={`flex min-w-0 items-center gap-1.5 ${i < crumbs.length - 2 ? "hidden md:flex" : ""}`}>
            {i > 0 && <ChevronRight size={14} className="shrink-0 text-muted/60" aria-hidden="true" />}
            {c.href ? <a href={c.href} className="truncate text-muted hover:text-heading">{c.label}</a>
              : <span className={`truncate ${i === crumbs.length - 1 ? "font-medium text-heading" : "text-muted"}`} aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ----------------------------- Command palette ----------------------------- */
type Cmd = { id: string; group: string; label: string; detail?: string; icon?: LucideIcon; run: () => void };
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, go, setTheme } = useAdmin();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [remote, setRemote] = useState<{ group: string; title: string; detail?: string; href: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const dq = useDebounced(q, 220);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the palette each time it opens
    setQ(""); setSel(0); setRemote([]);
    setTimeout(() => input.current?.focus(), 10);
  }, [open]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear or start a server search when the query changes
    if (!open || dq.trim().length < 2) { setRemote([]); return; }
    let live = true; setSearching(true);
    api("GET", `/search?q=${encodeURIComponent(dq.trim())}`).then((r) => { if (live) setRemote(r.results); }).catch(() => {}).finally(() => { if (live) setSearching(false); });
    return () => { live = false; };
  }, [dq, open]);

  const commands = useMemo<Cmd[]>(() => {
    const nav = (h: string) => () => { window.location.hash = h.replace(/^#/, ""); onClose(); };
    const actions: Cmd[] = [];
    if (can(user, "content")) actions.push(
      { id: "a-article", group: "Quick actions", label: "Create article", icon: Newspaper, run: nav("#/articles?new=1") },
      { id: "a-home", group: "Quick actions", label: "Edit homepage", icon: LayoutDashboard, run: nav("#/website/page%3Ahome") },
      { id: "a-upload", group: "Quick actions", label: "Upload media", icon: ImagePlus, run: nav("#/media?upload=1") },
      { id: "a-assess", group: "Quick actions", label: "Create assessment", icon: ListPlus, run: nav("#/templates?new=1") },
    );
    if (can(user, "leads")) actions.push({ id: "a-leads", group: "Quick actions", label: "Review new leads", icon: Users, run: nav("#/leads?status=new") });
    if (can(user, "settings")) actions.push({ id: "a-settings", group: "Quick actions", label: "Open website settings", icon: Settings, run: nav("#/settings") });
    actions.push(
      { id: "a-site", group: "Quick actions", label: "View public website", icon: ExternalLink, run: () => { window.open("/", "_blank", "noopener"); onClose(); } },
      { id: "t-light", group: "Theme", label: "Switch to light theme", icon: Sun, run: () => { setTheme("light"); onClose(); } },
      { id: "t-dark", group: "Theme", label: "Switch to dark theme", icon: Moon, run: () => { setTheme("dark"); onClose(); } },
      { id: "t-sys", group: "Theme", label: "Use system theme", icon: Monitor, run: () => { setTheme("system"); onClose(); } },
    );
    const pages = NAV.flatMap((g) => g.items.filter((it) => can(user, it.cap) && !it.external).map((it): Cmd & { kw: string } => ({ id: `n-${it.id}`, group: "Go to", label: it.label, detail: g.label, icon: it.icon, run: nav(it.href), kw: it.keywords ?? "" })));
    const t = q.trim().toLowerCase();
    const match = (c: Cmd & { kw?: string }) => { const hay = `${c.label} ${c.detail ?? ""} ${c.kw ?? ""}`.toLowerCase(); return !t || t.split(/\s+/).every((w) => hay.includes(w)); };
    const found: Cmd[] = remote.map((r, i) => ({ id: `r-${i}`, group: r.group, label: r.title, detail: r.detail, run: () => { go(r.href); onClose(); } }));
    return [...actions.filter(match), ...pages.filter(match).slice(0, t ? 12 : 8), ...found];
  }, [user, q, remote, go, onClose, setTheme]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the selection inside the list
  useEffect(() => { setSel((s) => Math.min(s, Math.max(0, commands.length - 1))); }, [commands.length]);
  useEffect(() => { listRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: "nearest" }); }, [sel]);
  if (!open) return null;
  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center bg-[#0b1424]/55 p-4 pt-[12vh] backdrop-blur-[2px] a-fade" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="a-pop w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--a-shadow-pop)]"
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
          else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(commands.length - 1, s + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          else if (e.key === "Enter") { e.preventDefault(); commands[sel]?.run(); }
          else if (e.key === "Tab") e.preventDefault();
        }}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
          <input ref={input} role="combobox" aria-expanded="true" aria-controls="cmd-list" aria-activedescendant={commands[sel] ? `cmd-${commands[sel].id}` : undefined} aria-autocomplete="list"
            className="h-14 w-full bg-transparent text-[0.9375rem] text-heading placeholder:text-muted focus:outline-none" placeholder="Search leads, assessments, pages, settings…" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[0.6875rem] text-muted sm:block">Esc</kbd>
        </div>
        <ul id="cmd-list" ref={listRef} role="listbox" aria-label="Results" className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
          {commands.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">{searching ? "Searching…" : `No results for “${q}”.`}</li>}
          {commands.map((c, idx) => {
            const head = c.group !== lastGroup; lastGroup = c.group;
            return (
              <li key={c.id} role="presentation">
                {head && <p className="px-3 pb-1 pt-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted first:pt-1">{c.group}</p>}
                <div id={`cmd-${c.id}`} role="option" aria-selected={sel === idx} data-idx={idx} onMouseMove={() => setSel(idx)} onClick={c.run}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${sel === idx ? "bg-mist text-heading" : "text-body"}`}>
                  {c.icon ? <c.icon size={16} className="shrink-0 text-muted" aria-hidden="true" /> : <span className="h-4 w-4 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate">{c.label}{c.detail && <span className="ml-2 text-xs text-muted">{c.detail}</span>}</span>
                  {sel === idx && <CornerDownLeft size={14} className="text-muted" aria-hidden="true" />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line bg-surface-2 px-4 py-2 text-[0.75rem] text-muted">
          <span>↑↓ to move</span><span>↵ to open</span><span className="ml-auto">{searching ? "Searching…" : "Results respect your permissions"}</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Notifications popover ----------------------------- */
function NotificationsButton() {
  const { counts, refreshCounts, go } = useAdmin();
  const [items, setItems] = useState<any[] | null>(null);
  const load = useCallback(() => api("GET", "/notifications").then((r) => setItems(r.notifications.slice(0, 8))).catch(() => setItems([])), []);
  const n = counts.notifications ?? 0;
  return (
    <Menu label="Notifications" width="w-[min(24rem,calc(100vw-1.5rem))]" trigger={({ open, toggle, id }) => (
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { if (!open) load(); toggle(); }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-heading">
        <span className="sr-only">Notifications{n ? `, ${n} unread` : ""}</span><Bell size={18} aria-hidden="true" />{n > 0 && <span aria-hidden="true" className="tnum absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.625rem] font-bold leading-4 text-white">{n > 9 ? "9+" : n}</span>}
      </button>
    )}>
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
            <p className="text-sm font-semibold text-heading">Notifications</p>
            {n > 0 && <button type="button" className="text-xs font-medium text-cobalt hover:underline" onClick={async () => { await api("POST", "/notifications/read", { all: true }); refreshCounts(); load(); }}>Mark all as read</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null ? <p className="px-3 py-6 text-center text-sm text-muted">Loading…</p> : items.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted">No notifications in the last 30 days.</p> : items.map((it) => (
              <MenuItem key={it.id} onClick={() => { api("POST", "/notifications/read", { ids: [it.id] }).then(refreshCounts).catch(() => {}); close(); if (it.href) go(it.href); }}>
                <span className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${it.read ? "bg-transparent" : "bg-brand"}`} aria-hidden="true" />
                  <span className="min-w-0"><span className={`block text-sm ${it.read ? "text-body" : "font-medium text-heading"}`}>{it.title}{!it.read && <span className="sr-only"> (unread)</span>}</span>
                    <span className="block truncate text-xs text-muted">{it.detail}</span><span className="block text-xs text-muted">{timeAgo(it.at)}</span></span>
                </span>
              </MenuItem>
            ))}
          </div>
          <MenuSep />
          <MenuItem onClick={() => { close(); go("notifications"); }}>View all notifications</MenuItem>
        </div>
      )}
    </Menu>
  );
}

/* --------------------------------- Top bar --------------------------------- */
function ThemeMenu() {
  const { theme, setTheme } = useAdmin();
  const I = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <Menu label="Theme" width="w-48" trigger={({ open, toggle, id }) => (
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-mist hover:text-heading" aria-label={`Theme: ${theme}`} title="Theme"><I size={18} aria-hidden="true" /></button>
    )}>
      {(close) => ([["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "System", Monitor]] as [Theme, string, LucideIcon][]).map(([k, l, Ic]) => (
        <MenuItem key={k} icon={Ic} onClick={() => { setTheme(k); close(); }}>{l}{theme === k && <Check size={14} className="ml-auto inline text-brand" aria-label="(current)" />}</MenuItem>
      ))}
    </Menu>
  );
}

function QuickCreate() {
  const { user } = useAdmin();
  const items: [string, string, LucideIcon][] = [];
  if (can(user, "content")) items.push(["#/articles?new=1", "Article", Newspaper], ["#/media?upload=1", "Upload media", ImagePlus], ["#/templates?new=1", "Assessment", ListPlus], ["#/redirects?new=1", "Redirect", FilePlus2]);
  if (can(user, "users")) items.push(["#/users?new=1", "User", Users]);
  if (!items.length) return null;
  return (
    <Menu label="Create" width="w-52" trigger={({ open, toggle, id }) => (
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgb(16_24_40/0.12)] hover:bg-brand-600">
        <Plus size={16} aria-hidden="true" /><span className="hidden sm:inline">Create</span>
      </button>
    )}>
      {(close) => items.map(([h, l, I]) => <MenuItem key={h} icon={I} href={h} onClick={close}>{l}</MenuItem>)}
    </Menu>
  );
}

function AccountMenu({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAdmin();
  return (
    <Menu label="Account" width="w-64" trigger={({ open, toggle, id }) => (
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle} className="ml-1 inline-flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-line" aria-label={`Account menu for ${user.name}`}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#6d3bea] to-[#1d4ed8] text-xs font-semibold text-white" aria-hidden="true">{initials(user.name)}</span>
      </button>
    )}>
      {(close) => (
        <>
          <div className="px-2.5 py-2"><p className="truncate text-sm font-semibold text-heading">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p><div className="mt-1.5"><Badge tone="brand">{user.role}</Badge></div></div>
          <MenuSep />
          {ACCOUNT_LINKS.map((l) => <MenuItem key={l.href} icon={l.icon} href={l.href} onClick={close}>{l.label}</MenuItem>)}
          <MenuSep />
          <MenuItem icon={LogOut} onClick={() => { close(); onSignOut(); }}>Sign out</MenuItem>
        </>
      )}
    </Menu>
  );
}

/* --------------------------------- Layout --------------------------------- */
export function AdminLayout({ section, id, crumb, children, collapsed, setCollapsed, onSignOut }: { section: string; id?: string; crumb?: string; children: ReactNode; collapsed: boolean; setCollapsed: (v: boolean) => void; onSignOut: () => void; user: User }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const closePalette = useCallback(() => setPalette(false), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [section, id]);
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <div className="flex min-h-screen">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-heading focus:shadow-lg">Skip to content</a>
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block"><Sidebar section={section} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onSignOut={onSignOut} /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-[#0b1424]/60 a-fade" onClick={() => setMobileOpen(false)} />
          <div className="a-drawer relative h-full w-fit"><Sidebar section={section} collapsed={false} mobile onClose={() => setMobileOpen(false)} onSignOut={onSignOut} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header data-topbar className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:px-5">
          <IconBtn icon={MenuIcon} label="Open navigation" onClick={() => setMobileOpen(true)} className="lg:hidden" />
          <IconBtn icon={collapsed ? ChevronsRight : ChevronsLeft} label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed(!collapsed)} className="hidden lg:inline-flex" />
          <div className="min-w-0 flex-1 pl-1"><Breadcrumbs section={section} id={id} extra={crumb} /></div>
          <button type="button" onClick={() => setPalette(true)} className="hidden h-9 w-[min(18rem,28vw)] items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm text-muted transition-colors hover:border-line-strong md:flex" aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}>
            <Search size={16} aria-hidden="true" /><span className="flex-1 text-left">Search…<span className="sr-only"> and commands</span></span><kbd className="rounded border border-line bg-surface px-1.5 text-[0.6875rem]">{mac ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <IconBtn icon={Search} label="Search and commands" onClick={() => setPalette(true)} className="md:hidden" />
          <QuickCreate />
          <IconBtn icon={ExternalLink} label="View public website" href="/" className="hidden sm:inline-flex" />
          <NotificationsButton />
          <ThemeMenu />
          <AccountMenu onSignOut={onSignOut} />
        </header>
        <main id="admin-main" tabIndex={-1} className="w-full flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[100rem]">{children}</div>
        </main>
      </div>
      <CommandPalette open={palette} onClose={closePalette} />
    </div>
  );
}
