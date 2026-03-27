import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DemoEvents } from "@/lib/demo-event-types";
import { isDemoMode } from "@/lib/demo-mode";
import { isDemoModeApiMutationAllowed } from "@/lib/demo-mode-allowlist";
import { HUB_USER_ROLE_COOKIE_NAME } from "@/lib/auth/session-cookie";

export { isDemoModeApiMutationAllowed } from "@/lib/demo-mode-allowlist";

function getRequestUrl(request: NextRequest | Request): string {
  if ("nextUrl" in request && request.nextUrl) {
    return (request as NextRequest).nextUrl.toString();
  }
  try {
    return new URL(request.url).toString();
  } catch {
    return "";
  }
}

function getHubUserRoleFromRequest(request: NextRequest | Request): string | undefined {
  if ("cookies" in request && request.cookies) {
    const v = (request as NextRequest).cookies.get(HUB_USER_ROLE_COOKIE_NAME)?.value?.trim();
    return v || undefined;
  }
  const raw = typeof request.headers?.get === "function" ? request.headers.get("cookie") : null;
  if (!raw) return undefined;
  const name = HUB_USER_ROLE_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!m?.[1]) return undefined;
  try {
    return decodeURIComponent(m[1].trim()) || undefined;
  } catch {
    return m[1].trim() || undefined;
  }
}

/**
 * Returns 403 JSON if DEMO_MODE and this request should be blocked. Use in route handlers
 * for defense-in-depth (middleware is the primary gate).
 */
function getRequestPathname(request: NextRequest | Request): string {
  if ("nextUrl" in request && request.nextUrl) {
    return (request as NextRequest).nextUrl.pathname;
  }
  try {
    return new URL(request.url).pathname;
  } catch {
    return "";
  }
}

export function blockIfDemoWrite(request: NextRequest | Request): NextResponse | null {
  if (!isDemoMode()) return null;
  const pathname = getRequestPathname(request);
  const method = request.method;
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) return null;
  if (isDemoModeApiMutationAllowed(pathname, method)) return null;

  console.warn("[DEMO MODE] Blocked write attempt:", { route: pathname, method });
  if (process.env.NEXT_PUBLIC_ENV === "staging") {
    const userRole = getHubUserRoleFromRequest(request);
    void import("./demo-analytics").then((m) =>
      m.trackDemoEvent(DemoEvents.BLOCKED_ACTION, {
        route: getRequestUrl(request),
        path: pathname,
        method: request.method,
        reason: "demo_mode",
        userRole: userRole ?? null,
      })
    );
  }
  return NextResponse.json(
    { error: "Demo mode — this action is disabled", code: "DEMO_MODE" },
    { status: 403 }
  );
}
