import type { NextRequest } from "next/server";

/**
 * Internal cron / worker routes: accept `Authorization: Bearer` matching
 * `INTERNAL_API_SECRET` when set, otherwise fall back to `CRON_SECRET`.
 */
export function getInternalEngineSecret(): string | undefined {
  return process.env.INTERNAL_API_SECRET?.trim() || process.env.CRON_SECRET?.trim();
}

export function isInternalEngineAuthorized(req: NextRequest): boolean {
  const expected = getInternalEngineSecret();
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token === expected;
}
