import "server-only";
import { getLocale } from "@/lib/locale-server";
import { localizeHref } from "@/lib/locale";

/** Canonical URL for the current language plus hreflang links to both language versions. */
export async function alternates(path: string) {
  const loc = await getLocale();
  return { canonical: localizeHref(path, loc), languages: { en: path, nl: localizeHref(path, "nl"), "x-default": path } };
}
