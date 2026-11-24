import "server-only";
import { cache } from "react";
import type { Industry, NavLink, Service } from "@/lib/data";
import { getDoc } from "./server";
import { SERVICE_SLUGS, type IndustriesDoc, type ServiceDoc, type SiteDoc } from "./defaults";
import { getLocale } from "@/lib/locale-server";
import type { Loc } from "@/lib/locale";
import { UI } from "./ui";

export type Catalog = {
  site: SiteDoc;
  services: Service[];
  serviceGroups: { label: string; description: string; slugs: string[] }[];
  industries: Industry[];
  nav: NavLink[];
  locale: Loc;
};

/** Shared, serialisable site data used by the header, footer and several pages. */
export const getCatalog = cache(async (): Promise<Catalog> => {
  const locale = await getLocale();
  const [site, ind, ...svc] = await Promise.all([
    getDoc<SiteDoc>("site"), getDoc<IndustriesDoc>("page:industries"), ...SERVICE_SLUGS.map((s) => getDoc<ServiceDoc>(`service:${s}`)),
  ]);
  const services = SERVICE_SLUGS.map((slug, i) => ({ ...(svc[i].card as Omit<Service, "slug" | "href">), slug, href: `/${slug}` })) as Service[];
  const known = new Set(SERVICE_SLUGS);
  return {
    site, services, industries: ind.items, nav: site.header.nav, locale,
    serviceGroups: site.serviceGroups.map((g) => ({ ...g, slugs: g.slugs.filter((x) => known.has(x)) })),
  };
});

export const serviceLookup = (services: Service[]) => (slug: string) => services.find((s) => s.slug === slug);

/** Template labels for the current language (server components). */
export const getUi = async () => UI[await getLocale()];
