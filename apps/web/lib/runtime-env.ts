/**
 * Server-side environment helpers (staging vs production, demo mode).
 * Client components must use `process.env.NEXT_PUBLIC_*` directly (inlined at build).
 */

export type PublicEnv = "development" | "staging" | "production";

export function getPublicEnv(): PublicEnv {
  const v = process.env.NEXT_PUBLIC_ENV?.trim().toLowerCase();
  if (v === "staging") return "staging";
  if (v === "production") return "production";
  if (process.env.NODE_ENV === "development") return "development";
  return "production";
}

export function isStagingEnv(): boolean {
  return getPublicEnv() === "staging";
}

export function isProductionEnv(): boolean {
  return getPublicEnv() === "production";
}

/** Use for session cookies: HTTPS deployments (staging + production builds), not local `next dev`. */
export function isSecureCookieContext(): boolean {
  return process.env.NODE_ENV !== "development";
}
