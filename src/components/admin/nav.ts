import {
  Activity, BarChart3, Bell, BookOpen, CalendarClock, ClipboardCheck, ClipboardList, FileText, FolderTree, Gauge, Globe, Home, Image as ImageIcon,
  KanbanSquare, KeyRound, Languages, LayoutDashboard, ListChecks, Mail, MessageSquare, Newspaper, PanelsTopLeft, ScrollText, Search, Server, Settings,
  ShieldCheck, Sparkles, SlidersHorizontal, Signpost, UserCog, Users, Briefcase, PhoneCall, Lock, type LucideIcon,
} from "lucide-react";
import type { Counts } from "./ctx";

export type NavItem = { id: string; href: string; label: string; icon: LucideIcon; cap: string; badge?: keyof Counts; badgeTone?: "brand" | "risk"; keywords?: string; external?: boolean };
export type NavGroup = { key: string; label: string; items: NavItem[]; collapsible?: boolean };

const i = (id: string, label: string, icon: LucideIcon, cap: string, extra: Partial<NavItem> = {}): NavItem => ({ id, href: `#/${id}`, label, icon, cap, ...extra });

/** Only implemented, permission-checked screens are listed. */
export const NAV: NavGroup[] = [
  { key: "workspace", label: "Workspace", items: [
    i("overview", "Overview", LayoutDashboard, "view", { keywords: "dashboard home kpi" }),
    i("analytics", "Business analytics", BarChart3, "view", { keywords: "reports charts conversion" }),
    i("activity", "Activity centre", Activity, "view", { keywords: "timeline events log" }),
    i("notifications", "Notifications", Bell, "view", { badge: "notifications", badgeTone: "brand" }),
  ] },
  { key: "leads", label: "Leads & customers", items: [
    i("leads", "All leads", Users, "leads", { badge: "new_leads", badgeTone: "brand", keywords: "crm contacts" }),
    i("consultations", "Consultation requests", PhoneCall, "leads", { badge: "consultations_new", badgeTone: "brand" }),
    i("enquiries", "Contact enquiries", MessageSquare, "leads", { badge: "enquiries_new", badgeTone: "brand", keywords: "contact form messages" }),
    i("pipeline", "Lead pipeline", KanbanSquare, "leads", { keywords: "kanban board stages" }),
    i("follow-ups", "Follow-ups", CalendarClock, "leads", { badge: "follow_ups_due", badgeTone: "risk", keywords: "tasks reminders due" }),
  ] },
  { key: "assessments", label: "Cybersecurity assessments", collapsible: true, items: [
    i("assessments", "Completed assessments", ClipboardCheck, "assessments", { keywords: "results submissions" }),
    i("reports", "Generated reports", FileText, "reports", { keywords: "pdf downloads links" }),
    i("assessment-analytics", "Assessment analytics", Gauge, "view", { keywords: "maturity scores drop-off" }),
    i("templates", "Assessment templates", ListChecks, "view", { keywords: "builder questionnaire" }),
    i("questions", "Question bank", FolderTree, "view"),
    i("categories", "Categories", ClipboardList, "view"),
    i("scoring", "Scoring configuration", SlidersHorizontal, "view", { keywords: "thresholds maturity levels" }),
    i("rules", "Recommendation rules", Sparkles, "view"),
  ] },
  { key: "website", label: "Website management", collapsible: true, items: [
    i("website", "Pages", PanelsTopLeft, "view", { keywords: "content cms edit" }),
    { ...i("homepage", "Homepage", Home, "view"), href: "#/website/page%3Ahome" },
    { ...i("services-content", "Services", Briefcase, "view"), href: "#/website?group=Services" },
    i("articles", "Insights & articles", Newspaper, "view", { keywords: "blog posts" }),
    i("media", "Media library", ImageIcon, "view", { keywords: "images uploads" }),
    { ...i("navigation", "Navigation & footer", Signpost, "view", { keywords: "menu header footer site settings" }), href: "#/website/site" },
  ] },
  { key: "seo", label: "Marketing & SEO", collapsible: true, items: [
    i("seo", "SEO overview", Search, "view", { keywords: "metadata titles descriptions google" }),
    i("redirects", "URL redirects", Signpost, "view", { keywords: "301 moved" }),
    i("localization", "Localization", Languages, "view", { keywords: "translations dutch nederlands" }),
  ] },
  { key: "admin", label: "Administration", collapsible: true, items: [
    i("users", "Users", UserCog, "users"),
    i("roles", "Roles & permissions", KeyRound, "view"),
    i("security", "Security centre", ShieldCheck, "view", { keywords: "sessions mfa sign-in" }),
    i("audit", "Audit log", ScrollText, "audit"),
    i("emails", "Email delivery", Mail, "settings", { badge: "emails_failed", badgeTone: "risk" }),
    i("settings", "Website settings", Settings, "settings", { keywords: "notifications lead scoring" }),
    i("privacy", "Privacy & retention", Lock, "settings", { keywords: "gdpr erase export" }),
    i("health", "System health", Server, "settings", { keywords: "status uptime database" }),
  ] },
  { key: "support", label: "Support", collapsible: true, items: [
    i("guide", "Administrator guide", BookOpen, "view", { keywords: "help how to" }),
    { ...i("site", "View public website", Globe, "view"), href: "/", external: true },
  ] },
];

/** Labels for breadcrumbs, including routes not in the sidebar. */
export const ROUTE_LABELS: Record<string, { label: string; group: string; parent?: string }> = {
  ...Object.fromEntries(NAV.flatMap((g) => g.items.map((it) => [it.id, { label: it.label, group: g.label }]))),
  account: { label: "My account", group: "Account" },
  website: { label: "Pages", group: "Website management" },
};

export const ACCOUNT_LINKS = [
  { href: "#/account", label: "My profile & password", icon: UserCog },
  { href: "#/account?tab=mfa", label: "Two-factor & backup codes", icon: KeyRound },
  { href: "#/security", label: "Active sessions", icon: ShieldCheck },
];
