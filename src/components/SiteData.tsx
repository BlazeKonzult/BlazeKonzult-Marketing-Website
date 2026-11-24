"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Catalog } from "@/content/catalog";
import type { Service } from "@/lib/data";
import { UI, type Ui } from "@/content/ui";
import { localizeHref } from "@/lib/locale";

type SiteData = Catalog & { serviceBySlug: (slug: string) => Service; t: Ui; lp: (href: string) => string };
const Ctx = createContext<SiteData | null>(null);

/** Makes admin-edited shared content (navigation, services, industries, company details) available to client components. */
export function SiteDataProvider({ data, children }: { data: Catalog; children: ReactNode }) {
  const value = useMemo<SiteData>(() => {
    const map = new Map(data.services.map((s) => [s.slug, s]));
    return { ...data, t: UI[data.locale], lp: (h: string) => localizeHref(h, data.locale), serviceBySlug: (slug: string) => map.get(slug) ?? { slug, href: `/${slug}`, name: slug, category: "Assess", shortDescription: "", bestSuitedFor: "", deliverables: [], outcome: "", icon: "Shield" } };
  }, [data]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite(): SiteData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite must be used inside SiteDataProvider");
  return v;
}

/** Locale-aware helpers that also work outside the provider (defaults to English). */
export function useT(): { t: Ui; lp: (href: string) => string; locale: "en" | "nl" } {
  const v = useContext(Ctx);
  return v ? { t: v.t, lp: v.lp, locale: v.locale } : { t: UI.en, lp: (h) => h, locale: "en" };
}
