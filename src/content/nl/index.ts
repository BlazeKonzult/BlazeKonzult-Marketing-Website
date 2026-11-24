import { aboutNl, contactNl, cookieNl, disclosureNl, homeNl, industriesNl, privacyNl, resourcesNl, servicesPageNl, siteNl } from "./pages";
import { servicesNl } from "./services";

const PAGES: Record<string, unknown> = {
  site: siteNl, "page:home": homeNl, "page:about": aboutNl, "page:services": servicesPageNl, "page:industries": industriesNl,
  "page:resources": resourcesNl, "page:contact": contactNl, "page:privacy-policy": privacyNl, "page:cookie-policy": cookieNl, "page:responsible-disclosure": disclosureNl,
};

/** Dutch default for a content key, or null when only English exists (e.g. articles). */
export function nlDefaultsFor(key: string): unknown {
  if (key.startsWith("service:")) return servicesNl[key.slice(8)] ?? null;
  return PAGES[key] ?? null;
}
