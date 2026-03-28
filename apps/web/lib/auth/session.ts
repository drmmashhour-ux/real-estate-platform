import { cookies, headers } from "next/headers";
import {
  AUTH_SESSION_COOKIE_NAME,
  getCookieValueFromHeader,
  HUB_USER_ROLE_COOKIE_NAME,
  TENANT_CONTEXT_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
import { isSecureCookieContext } from "@/lib/runtime-env";
import { resolveSessionTokenToUserId } from "@/lib/auth/db-session";

export {
  AUTH_SESSION_COOKIE_NAME,
  HUB_USER_ROLE_COOKIE_NAME,
  TENANT_CONTEXT_COOKIE_NAME,
} from "@/lib/auth/session-cookie";

export async function getGuestId(): Promise<string | null> {
  const raw = getCookieValueFromHeader((await headers()).get("cookie"), AUTH_SESSION_COOKIE_NAME);
  return resolveSessionTokenToUserId(raw);
}

/** User role for hub routing and access control (admin-only hub). */
export async function getUserRole(): Promise<string | null> {
  const c = await cookies();
  return c.get(HUB_USER_ROLE_COOKIE_NAME)?.value ?? null;
}

/** Hub role cookie mirrors Prisma `PlatformRole` (e.g. ADMIN); some guards compared lowercase `admin` only. */
export function isHubAdminRole(role: string | null | undefined): boolean {
  return (role ?? "").toUpperCase() === "ADMIN";
}

export function setUserRoleCookie(role: string) {
  return {
    name: HUB_USER_ROLE_COOKIE_NAME,
    value: role,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
    secure: isSecureCookieContext(),
    sameSite: "lax" as const,
  };
}

/** Cookie descriptor — `value` must be an opaque session token from `createDbSession`, not a raw user id. */
export function setGuestIdCookie(sessionToken: string) {
  return {
    name: AUTH_SESSION_COOKIE_NAME,
    value: sessionToken,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: isSecureCookieContext(),
    sameSite: "lax" as const,
  };
}

export function setTenantContextCookie(tenantId: string) {
  return {
    name: TENANT_CONTEXT_COOKIE_NAME,
    value: tenantId,
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    httpOnly: true,
    secure: isSecureCookieContext(),
    sameSite: "lax" as const,
  };
}

export function clearTenantContextCookie() {
  return {
    name: TENANT_CONTEXT_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: isSecureCookieContext(),
    sameSite: "lax" as const,
  };
}
