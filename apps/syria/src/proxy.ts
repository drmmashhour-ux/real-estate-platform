import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { s2GetClientIp } from "@/lib/security/s2-ip";
import { s2CheckRateLimit } from "@/lib/security/s2-rate-limit";
import { s2Log } from "@/lib/security/s2-logger";

const intlMiddleware = createMiddleware(routing);

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

/** S2 — per-IP rate limit on high-abuse public APIs (≈15/min). */
function s2RateLimitTagApi(pathname: string): string | null {
  if (pathname.startsWith("/api/lead")) return "s2:lead";
  if (pathname.startsWith("/api/payments")) return "s2:payments";
  if (pathname === "/api/listings/create") return "s2:listings_create";
  return null;
}

/**
 * Next.js 16+: use this file only (not `middleware.ts`). Chains S2 + MVP + next-intl locale routing.
 */
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const s2Tag = s2RateLimitTagApi(pathname);
  if (s2Tag) {
    const ip = s2GetClientIp(request);
    const key = `${s2Tag}|${ip}`;
    const r = s2CheckRateLimit(key);
    if (!r.ok) {
      s2Log("s2_rate_limited", { path: pathname, ip, retryAfter: r.retryAfterSec });
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } },
      );
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!MVP_ON) {
    return intlMiddleware(request);
  }
  const rel = pathWithoutLocale(pathname);
  if (!isBlockedPath(rel)) {
    return intlMiddleware(request);
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
