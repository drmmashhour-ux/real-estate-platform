/**
 * Session cookie: httpOnly; value is an opaque `Session.token` (resolved to `User.id` server-side).
 * Cookie name kept as `lecipm_guest_id` for backward-compatible client checks.
 */
export const AUTH_SESSION_COOKIE_NAME = "lecipm_guest_id" as const;

/** Current workspace (tenant) id for multi-tenant CRM; set server-side via `/api/tenants/switch`. */
export const TENANT_CONTEXT_COOKIE_NAME = "lecipm_tenant_id" as const;

/** Non-httpOnly; used by middleware + header (Edge-safe). */
export const HUB_USER_ROLE_COOKIE_NAME = "hub_user_role" as const;

/** Middleware forwards the requested path for safe post-login redirects from layouts. */
export const LECIPM_PATH_HEADER = "x-lecipm-path" as const;

export function parseSessionUserId(value: string | undefined | null): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v.length > 0 ? v : null;
}

/** Read a cookie value from the raw `Cookie` request header (matches Route Handler parsing). */
export function getCookieValueFromHeader(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    if (k !== name) continue;
    let v = part.slice(i + 1).trim();
    try {
      v = decodeURIComponent(v);
    } catch {
      /* keep raw */
    }
    return v;
  }
  return undefined;
}
