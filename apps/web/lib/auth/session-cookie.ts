/**
 * Session cookie: set on successful login/register (httpOnly).
 * Value is the authenticated User.id (legacy internal name: "guest_id").
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
