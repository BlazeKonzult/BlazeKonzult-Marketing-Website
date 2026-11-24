/** Site languages. English lives at /, Dutch at /nl/. */
export type Loc = "en" | "nl";
export const LOCALES: Loc[] = ["en", "nl"];

const SKIP = /^\/(api|media|admin|images|_next|nl)(\/|$)|\.[a-z0-9]{2,5}$/i;

/** Adds the /nl prefix to internal links on Dutch pages. External, hash and asset links are left alone. */
export function localizeHref(href: string, loc: Loc): string {
  if (loc === "en" || !href || !href.startsWith("/") || href.startsWith("//")) return href;
  if (SKIP.test(href.split(/[?#]/)[0])) return href;
  return href === "/" ? "/nl/" : `/nl${href}`;
}

/** The same page in the other language. */
export function switchLocalePath(pathname: string): { loc: Loc; path: string } {
  if (pathname === "/nl" || pathname.startsWith("/nl/")) return { loc: "en", path: pathname.slice(3) || "/" };
  return { loc: "nl", path: pathname === "/" ? "/nl/" : `/nl${pathname}` };
}

/** Path without the language prefix (used for canonical/hreflang). */
export const basePath = (pathname: string) => (pathname === "/nl" || pathname.startsWith("/nl/") ? pathname.slice(3) || "/" : pathname);
