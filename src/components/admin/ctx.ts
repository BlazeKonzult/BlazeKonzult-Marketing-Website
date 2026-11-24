"use client";
import { createContext, useContext } from "react";
import type { User } from "./lib";

export type Theme = "light" | "dark" | "system";
export type Counts = Partial<Record<"new_leads" | "consultations_new" | "enquiries_new" | "follow_ups_due" | "emails_failed" | "notifications", number | null>>;
export type Ctx = {
  user: User;
  notify: (text: string, tone?: "ok" | "risk" | "info") => void;
  go: (hash: string) => void;
  counts: Counts;
  refreshCounts: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  query: URLSearchParams;
};
export const AdminCtx = createContext<Ctx | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;
