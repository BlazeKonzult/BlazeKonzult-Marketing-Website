import { NextResponse, type NextRequest } from "next/server";

/**
 * Dutch pages live under /nl/. Requests are rewritten to the shared page with an x-bk-locale header,
 * so every page reads its language from the request. (The assessment has its own /nl routes.)
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isNl = pathname === "/nl" || pathname.startsWith("/nl/");
  const headers = new Headers(req.headers);
  headers.set("x-bk-locale", isNl ? "nl" : "en");
  headers.set("x-bk-path", isNl ? pathname.slice(3) || "/" : pathname);
  if (isNl && !pathname.startsWith("/nl/cybersecurity-assessment")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|media|admin|_next|images|favicon.ico|icon|apple-icon|manifest|robots.txt|sitemap.xml|icon-).*)"],
};
