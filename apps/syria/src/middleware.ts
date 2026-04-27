import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * H1 — Non-MVP routes blocked when phone-first MVP is on.
 * Must match `syriaFlags.SYRIA_MVP` in `lib/platform-flags.ts` (MVP default on unless `SYRIA_MVP=false`).
 */
const BLOCKED = ["/admin/growth", "/admin/campaigns", "/bnhub", "/bnhub/stays"] as const;

const MVP_ON = process.env.SYRIA_MVP !== "false";

function pathWithoutLocale(pathname: string): string {
  if (pathname === "/ar" || pathname === "/en") return "/";
  for (const loc of ["ar", "en"] as const) {
    const prefix = `/${loc}`;
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) {
      return pathname.slice(prefix.length) || "/";
    }
  }
  return pathname;
}

function isBlockedPath(rel: string): boolean {
  return BLOCKED.some((b) => rel === b || rel.startsWith(`${b}/`));
}

export function middleware(request: NextRequest) {
  if (!MVP_ON) {
    return NextResponse.next();
  }
  const pathname = request.nextUrl.pathname;
  const rel = pathWithoutLocale(pathname);
  if (!isBlockedPath(rel)) {
    return NextResponse.next();
  }
  const m = pathname.match(/^\/(ar|en)(?=\/|$)/);
  const locale = m ? m[1] : "ar";
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}`;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
