/**
 * Demo session (cookie impersonation by email) and demo user listing must never run in production.
 * Single source of truth for API routes and UI.
 */
export function isDemoAuthAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}

export const DEMO_AUTH_DISABLED_MESSAGE =
  "Demo sign-in is disabled in production. Use your account password or the platform sign-in flow.";
