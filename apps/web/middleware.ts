import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import {
  ATTRIBUTION_COOKIE_MAX_AGE_SEC,
  LECIPM_ATTRIBUTION_COOKIE,
} from "@/lib/attribution/constants";
import {
  attributionFromSearchParams,
  parseAttributionCookieHeader,
  serializeAttributionCookieValue,
} from "@/lib/attribution/cookie-value";
import { shouldSetFirstTouchCookie } from "@/lib/attribution/lead-attribution";
import {
  AUTH_SESSION_COOKIE_NAME,
  HUB_USER_ROLE_COOKIE_NAME,
  LECIPM_PATH_HEADER,
  parseSessionUserId,
} from "@/lib/auth/session-cookie";
import { isDemoMode } from "@/lib/demo-mode";
import { isDemoModeApiMutationAllowed } from "@/lib/demo-mode-allowlist";
import { DemoEvents } from "@/lib/demo-event-types";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";
import {
  hasRawCardLikePayload,
  jsonResponseRawCardBlocked,
} from "@/lib/security/blockRawCardData";
import { runApiSecurityLayer } from "@/modules/security/security-middleware";
import { runComplianceSecurityLayer } from "@/lib/server/compliance-middleware";
import { isSecureCookieContext } from "@/lib/runtime-env";
import { isPublicBrowseSurface } from "@/lib/routing/public-browse-paths";
import { HUB_USER_ROLE_COOKIE } from "@/lib/staging-middleware-config";
import {
  appPathnameFromUrl,
  countryFromPathname,
  ensureCountryInPathname,
  localeCountryMismatchRedirect,
  localeFromPathname,
  resolveCountrySlugOrDefault,
} from "@/i18n/pathname";
import { COUNTRY_COOKIE } from "@/lib/region/country-cookie";
import { LECIPM_COUNTRY_HEADER } from "@/lib/region/request-country";
import {
  DEFAULT_COUNTRY_SLUG,
  isCountrySlug,
  ROUTED_COUNTRY_SLUGS,
  type CountryCodeLower,
} from "@/config/countries";
import { routing } from "@/i18n/routing";
import { EXPERIMENT_SESSION_COOKIE_NAME, EXPERIMENT_SESSION_HEADER } from "@/lib/experiments/constants";

/** Must match `next-intl` internal header so `getLocale()` stays in sync when we rebuild `NextResponse.next`. */
const NEXT_INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

const intlMiddleware = createIntlMiddleware(routing);

function defaultCountryFromRequest(request: NextRequest): CountryCodeLower {
  const fromCookie = request.cookies.get(COUNTRY_COOKIE)?.value?.toLowerCase();
  if (fromCookie && isCountrySlug(fromCookie) && ROUTED_COUNTRY_SLUGS.includes(fromCookie as CountryCodeLower)) {
    return fromCookie as CountryCodeLower;
  }
  const geo = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (geo === "CA") return "ca";
  if (geo === "SY") return "sy";
  return DEFAULT_COUNTRY_SLUG;
}

function finalizePageResponse(
  request: NextRequest,
  intlResponse: NextResponse,
  extraRequestHeaders?: Record<string, string>,
): NextResponse {
  const rewrite = intlResponse.headers.get("x-middleware-rewrite");
  if (rewrite) {
    return attachRequestIdToResponse(request, intlResponse);
  }
  const locale = localeFromPathname(request.nextUrl.pathname);
  const countrySlug = resolveCountrySlugOrDefault(request.nextUrl.pathname);
  const h = new Headers(request.headers);
  h.set(NEXT_INTL_LOCALE_HEADER, locale);
  h.set(LECIPM_COUNTRY_HEADER, countrySlug);
  const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
  if (id) h.set(REQUEST_ID_HEADER, id);
  if (extraRequestHeaders) {
    for (const [k, v] of Object.entries(extraRequestHeaders)) {
      h.set(k, v);
    }
  }
  const existingExp = request.cookies.get(EXPERIMENT_SESSION_COOKIE_NAME)?.value?.trim();
  const expSessionId = existingExp && existingExp.length >= 8 ? existingExp : crypto.randomUUID();
  h.set(EXPERIMENT_SESSION_HEADER, expSessionId);
  const res = NextResponse.next({ request: { headers: h } });
  if (!existingExp || existingExp.length < 8) {
    res.cookies.set({
      name: EXPERIMENT_SESSION_COOKIE_NAME,
      value: expSessionId,
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
      sameSite: "lax",
      secure: isSecureCookieContext(),
      httpOnly: true,
    });
  }
  return res;
}

/** Staging page gates only — do not mark `/api/*` public or protected API routes never run. */
function isPublicPathForStaging(pathname: string): boolean {
  const p = pathname.startsWith("/api/")
    ? pathname
    : appPathnameFromUrl(pathname);
  if (p.startsWith("/_next")) return true;
  if (p.startsWith("/auth")) return true;
  if (p.startsWith("/embed")) return true;
  if (p === "/favicon.ico" || p === "/manifest.json" || p === "/robots.txt") return true;
  if (p.startsWith("/images/") || p.startsWith("/brand/") || p.startsWith("/branding/")) return true;
  if (/\.(ico|png|svg|jpg|jpeg|gif|webp|json|txt|xml|webmanifest)$/i.test(pathname)) return true;
  if (p === "/api/health" || p === "/api/ready") return true;
  if (p === "/api/operators/waitlist") return true;
  if (isPublicBrowseSurface(pathname)) return true;
  return false;
}

function applyAttributionCookie(request: NextRequest, response: NextResponse): NextResponse {
  const incoming = attributionFromSearchParams(request.nextUrl.searchParams);
  if (!incoming.source && !incoming.campaign && !incoming.medium) {
    return response;
  }
  const existingRaw = request.headers.get("cookie");
  const existing = parseAttributionCookieHeader(existingRaw);
  if (!shouldSetFirstTouchCookie(existing, incoming)) {
    return response;
  }
  const value = serializeAttributionCookieValue({
    source: incoming.source,
    campaign: incoming.campaign,
    medium: incoming.medium,
    capturedAt: new Date().toISOString(),
  });
  response.cookies.set({
    name: LECIPM_ATTRIBUTION_COOKIE,
    value,
    maxAge: ATTRIBUTION_COOKIE_MAX_AGE_SEC,
    path: "/",
    sameSite: "lax",
    secure: isSecureCookieContext(),
  });
  return response;
}

function ensureRequestIdHeader(request: NextRequest): Headers {
  const h = new Headers(request.headers);
  if (!h.get(REQUEST_ID_HEADER)) {
    h.set(REQUEST_ID_HEADER, crypto.randomUUID());
  }
  return h;
}

function withRequestId(request: NextRequest): NextResponse {
  return NextResponse.next({ request: { headers: ensureRequestIdHeader(request) } });
}

function redirectWithRequestId(request: NextRequest, url: URL): NextResponse {
  const res = NextResponse.redirect(url);
  const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
  if (id) res.headers.set(REQUEST_ID_HEADER, id);
  return res;
}

function attachRequestIdToResponse(request: NextRequest, response: NextResponse): NextResponse {
  const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
  if (id) response.headers.set(REQUEST_ID_HEADER, id);
  return response;
}

/**
 * Network boundary (middleware convention): next-intl locale routing, staging/demo gates, auth redirects, API gates.
 * Injects `x-request-id` for structured logging downstream.
 */
export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    // STEP 14 — ADD REDIRECTS
    const isBnhub = pathname.startsWith("/bnhub") || /^\/[a-z]{2}\/[a-z]{2}\/bnhub/.test(pathname);
    const isBroker = pathname.includes("/dashboard/broker");
    const isAdmin = pathname.includes("/dashboard/admin");

    if (isBnhub) {
      return NextResponse.redirect(new URL("http://localhost:3003" + pathname + request.nextUrl.search, request.url));
    }
    if (isBroker) {
      return NextResponse.redirect(new URL("http://localhost:3004" + pathname + request.nextUrl.search, request.url));
    }
    if (isAdmin) {
      return NextResponse.redirect(new URL("http://localhost:3002" + pathname + request.nextUrl.search, request.url));
    }

    if (pathname.startsWith("/api/")) {
      const blocked = runApiSecurityLayer(request);
      if (blocked) {
        return blocked;
      }
      
      const complianceBlocked = runComplianceSecurityLayer(request);
      if (complianceBlocked) {
        return complianceBlocked;
      }
    }

    if (request.method === "POST" && pathname.startsWith("/api/") && !pathname.includes("webhook")) {
      const ct = request.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        try {
          const text = await request.clone().text();
          if (text.trim() !== "") {
            try {
              const parsed = JSON.parse(text) as unknown;
              if (hasRawCardLikePayload(parsed)) {
                return jsonResponseRawCardBlocked();
              }
            } catch {
              /* invalid JSON — let route handler reject */
            }
          }
        } catch {
          /* body read failed — continue */
        }
      }
    }

    if (isDemoMode() && pathname.startsWith("/api/")) {
      const m = request.method.toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(m) && !isDemoModeApiMutationAllowed(pathname, m)) {
        console.warn("[DEMO MODE] Blocked write attempt:", { route: pathname, method: m });
        const secret = process.env.CRON_SECRET?.trim();
        if (secret && process.env.NEXT_PUBLIC_ENV === "staging") {
          const url = new URL("/api/internal/demo-event", request.url);
          const userRole = request.cookies.get(HUB_USER_ROLE_COOKIE)?.value?.trim() ?? null;
          void fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${secret}`,
            },
            body: JSON.stringify({
              event: DemoEvents.BLOCKED_ACTION,
              metadata: {
                route: request.nextUrl.toString(),
                path: pathname,
                method: m,
                reason: "demo_mode",
                userRole,
              },
            }),
          }).catch(() => {});
        }
        const res = NextResponse.json(
          { error: "Demo mode — this action is disabled", code: "DEMO_MODE" },
          { status: 403 }
        );
        const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
        if (id) res.headers.set(REQUEST_ID_HEADER, id);
        return res;
      }
    }

    if (pathname.startsWith("/api/")) {
      if (pathname.startsWith("/api/experiments/track")) {
        return applyAttributionCookie(request, withRequestId(request));
      }
      if (isPublicPathForStaging(pathname)) {
        return applyAttributionCookie(request, withRequestId(request));
      }

      const requireLogin =
        process.env.NEXT_PUBLIC_ENV === "staging" &&
        process.env.NEXT_PUBLIC_STAGING_REQUIRE_LOGIN === "1";

      if (requireLogin && !isPublicPathForStaging(pathname)) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${routing.defaultLocale}/${DEFAULT_COUNTRY_SLUG}/auth/login`;
        loginUrl.searchParams.set("next", pathname + (request.nextUrl.search || ""));
        return redirectWithRequestId(request, loginUrl);
      }

      if (pathname.startsWith("/api/dashboard")) {
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      if (pathname.startsWith("/api/documents")) {
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      if (pathname.startsWith("/api/intake")) {
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      if (pathname.startsWith("/api/notifications") || pathname.startsWith("/api/action-queue")) {
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      if (pathname.startsWith("/api/admin")) {
        const cron = process.env.CRON_SECRET?.trim();
        const authHeader = request.headers.get("authorization") ?? "";
        const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (cron && bearer === cron) {
          return withRequestId(request);
        }
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      if (pathname.startsWith("/api/investment-deals")) {
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      if (pathname.startsWith("/api/tenants") || pathname.startsWith("/api/finance")) {
        const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
        if (!session) {
          const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          const id = ensureRequestIdHeader(request).get(REQUEST_ID_HEADER);
          if (id) res.headers.set(REQUEST_ID_HEADER, id);
          return res;
        }
        return withRequestId(request);
      }

      return applyAttributionCookie(request, withRequestId(request));
    }

    const intlResponse = intlMiddleware(request);
    if (intlResponse.headers.get("location")) {
      return applyAttributionCookie(request, attachRequestIdToResponse(request, intlResponse));
    }

    const defaultCountry = defaultCountryFromRequest(request);
    const missingCountryRedirect = ensureCountryInPathname(pathname, defaultCountry);
    if (missingCountryRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = missingCountryRedirect;
      const res = redirectWithRequestId(request, url);
      res.cookies.set({
        name: COUNTRY_COOKIE,
        value: defaultCountry,
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: isSecureCookieContext(),
      });
      return applyAttributionCookie(request, res);
    }

    const localeFix = localeCountryMismatchRedirect(pathname);
    if (localeFix) {
      const url = request.nextUrl.clone();
      url.pathname = localeFix;
      return applyAttributionCookie(request, redirectWithRequestId(request, url));
    }

    const logicalPath = appPathnameFromUrl(pathname);
    const localeSeg = localeFromPathname(pathname);
    const countrySeg = countryFromPathname(pathname) ?? DEFAULT_COUNTRY_SLUG;

    if (isPublicPathForStaging(pathname)) {
      return applyAttributionCookie(request, finalizePageResponse(request, intlResponse));
    }

    const requireLogin =
      process.env.NEXT_PUBLIC_ENV === "staging" &&
      process.env.NEXT_PUBLIC_STAGING_REQUIRE_LOGIN === "1";

    if (requireLogin && !isPublicPathForStaging(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${localeSeg}/${countrySeg}/auth/login`;
      loginUrl.searchParams.set("next", pathname + (request.nextUrl.search || ""));
      return redirectWithRequestId(request, loginUrl);
    }

    const pathHeaderValue = pathname + request.nextUrl.search;

    if (logicalPath.startsWith("/demo")) {
      return applyAttributionCookie(
        request,
        finalizePageResponse(request, intlResponse, { [LECIPM_PATH_HEADER]: pathHeaderValue }),
      );
    }

    if (logicalPath.startsWith("/compare") && !logicalPath.startsWith("/compare/fsbo")) {
      const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
      if (!session) {
        const login = new URL("/auth/login", request.url);
        login.pathname = `/${localeSeg}/${countrySeg}/auth/login`;
        login.searchParams.set("next", pathname + request.nextUrl.search);
        return redirectWithRequestId(request, login);
      }
      return applyAttributionCookie(
        request,
        finalizePageResponse(request, intlResponse, { [LECIPM_PATH_HEADER]: pathHeaderValue }),
      );
    }

    if (logicalPath.startsWith("/dashboard")) {
      const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
      if (!session) {
        const login = new URL("/auth/login", request.url);
        login.pathname = `/${localeSeg}/${countrySeg}/auth/login`;
        login.searchParams.set("next", pathname + request.nextUrl.search);
        return redirectWithRequestId(request, login);
      }
      return applyAttributionCookie(
        request,
        finalizePageResponse(request, intlResponse, { [LECIPM_PATH_HEADER]: pathHeaderValue }),
      );
    }

    if (logicalPath.startsWith("/admin")) {
      const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
      if (!session) {
        const login = new URL("/auth/login", request.url);
        login.pathname = `/${localeSeg}/${countrySeg}/auth/login`;
        login.searchParams.set("next", pathname + request.nextUrl.search);
        return redirectWithRequestId(request, login);
      }
      const role = request.cookies.get(HUB_USER_ROLE_COOKIE_NAME)?.value?.trim().toUpperCase() ?? "";
      if (role !== "ADMIN" && role !== "ACCOUNTANT") {
        const dash = request.nextUrl.clone();
        dash.pathname = `/${localeSeg}/${countrySeg}/dashboard`;
        dash.search = "";
        return redirectWithRequestId(request, dash);
      }
      return applyAttributionCookie(
        request,
        finalizePageResponse(request, intlResponse, { [LECIPM_PATH_HEADER]: pathHeaderValue }),
      );
    }

    return applyAttributionCookie(request, finalizePageResponse(request, intlResponse));
  } catch {
    return withRequestId(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
