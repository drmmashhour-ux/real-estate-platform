/**
 * Staging-only middleware (Edge). Uses NEXT_PUBLIC_* vars inlined at build.
 */
import { HUB_USER_ROLE_COOKIE_NAME } from "@/lib/auth/session-cookie";

export const HUB_USER_ROLE_COOKIE = HUB_USER_ROLE_COOKIE_NAME;

const DEFAULT_ALLOWED = new Set(["USER", "CLIENT", "TESTER", "ADMIN", "ACCOUNTANT"]);

export function stagingRequireLogin(): boolean {
  const v = process.env.NEXT_PUBLIC_STAGING_REQUIRE_LOGIN?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function stagingRoleGateEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_STAGING_ROLE_GATE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function stagingAllowedRoles(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_STAGING_ALLOWED_ROLES?.trim();
  if (!raw) return DEFAULT_ALLOWED;
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const s = part.trim().toUpperCase();
    if (s) set.add(s);
  }
  return set.size > 0 ? set : DEFAULT_ALLOWED;
}

export function isPublicPagePath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/auth")) return true;
  if (pathname.startsWith("/embed")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico" || pathname === "/manifest.json" || pathname === "/robots.txt") return true;
  if (pathname.startsWith("/images/") || pathname.startsWith("/brand/")) return true;
  if (/\.(ico|png|svg|jpg|jpeg|gif|webp|json|txt|xml|webmanifest)$/i.test(pathname)) return true;
  return false;
}
