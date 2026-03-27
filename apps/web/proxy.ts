import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
  LECIPM_PATH_HEADER,
  parseSessionUserId,
} from "@/lib/auth/session-cookie";
import { isDemoMode } from "@/lib/demo-mode";
import { isDemoModeApiMutationAllowed } from "@/lib/demo-mode-allowlist";
import { DemoEvents } from "@/lib/demo-event-types";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";
import { isSecureCookieContext } from "@/lib/runtime-env";
import {
  HUB_USER_ROLE_COOKIE,
  stagingAllowedRoles,
  stagingRequireLogin,
  stagingRoleGateEnabled,
} from "@/lib/staging-middleware-config";

/** Staging page gates only — do not mark `/api/*` public or protected API routes never run. */
function isPublicPathForStaging(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/embed")) return true;
  if (pathname === "/favicon.ico" || pathname === "/manifest.json" || pathname === "/robots.txt") return true;
  if (pathname.startsWith("/images/") || pathname.startsWith("/brand/")) return true;
  if (/\.(ico|png|svg|jpg|jpeg|gif|webp|json|txt|xml|webmanifest)$/i.test(pathname)) return true;
  if (pathname === "/api/health" || pathname === "/api/ready") return true;
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

/**
 * Next.js 16+ network boundary: merges legacy staging/demo gates with auth redirects and API gates.
 * Injects `x-request-id` for structured logging downstream.
 */
export function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

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

    if (isPublicPathForStaging(pathname)) {
      return applyAttributionCookie(request, withRequestId(request));
    }

    if (process.env.NEXT_PUBLIC_ENV === "staging") {
      const stagingLogin = stagingRequireLogin();
      const roleGate = stagingRoleGateEnabled();
      if (stagingLogin || roleGate) {
        const sessionId = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value?.trim();
        const role = request.cookies.get(HUB_USER_ROLE_COOKIE)?.value?.trim()?.toUpperCase() ?? "";

        if (stagingLogin && !sessionId) {
          const loginUrl = request.nextUrl.clone();
          loginUrl.pathname = "/auth/login";
          loginUrl.searchParams.set("next", pathname + (request.nextUrl.search || ""));
          return redirectWithRequestId(request, loginUrl);
        }

        if (roleGate && sessionId) {
          if (!role) {
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = "/auth/login";
            loginUrl.searchParams.set("next", pathname + (request.nextUrl.search || ""));
            loginUrl.searchParams.set("reason", "session_refresh");
            return redirectWithRequestId(request, loginUrl);
          }
          const allowed = stagingAllowedRoles();
          if (!allowed.has(role)) {
            const u = request.nextUrl.clone();
            u.pathname = "/auth/staging-restricted";
            u.search = "";
            return redirectWithRequestId(request, u);
          }
        }
      }
    }

    if (pathname.startsWith("/demo")) {
      const requestHeaders = ensureRequestIdHeader(request);
      requestHeaders.set(LECIPM_PATH_HEADER, pathname + request.nextUrl.search);
      return applyAttributionCookie(request, NextResponse.next({ request: { headers: requestHeaders } }));
    }

    if (pathname.startsWith("/compare") && !pathname.startsWith("/compare/fsbo")) {
      const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
      if (!session) {
        const login = new URL("/auth/login", request.url);
        login.searchParams.set("next", pathname + request.nextUrl.search);
        return redirectWithRequestId(request, login);
      }
      const requestHeaders = ensureRequestIdHeader(request);
      requestHeaders.set(LECIPM_PATH_HEADER, pathname + request.nextUrl.search);
      return applyAttributionCookie(request, NextResponse.next({ request: { headers: requestHeaders } }));
    }

    if (pathname.startsWith("/dashboard")) {
      const session = parseSessionUserId(request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value);
      if (!session) {
        const login = new URL("/auth/login", request.url);
        login.searchParams.set("next", pathname + request.nextUrl.search);
        return redirectWithRequestId(request, login);
      }
      const requestHeaders = ensureRequestIdHeader(request);
      requestHeaders.set(LECIPM_PATH_HEADER, pathname + request.nextUrl.search);
      return applyAttributionCookie(request, NextResponse.next({ request: { headers: requestHeaders } }));
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

    if (pathname.startsWith("/api/admin/analytics")) {
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
  } catch {
    return withRequestId(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
