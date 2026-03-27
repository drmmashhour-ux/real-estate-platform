import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Shared secret for Supabase Edge Functions, Vercel Cron, and other server callers.
 * Accepts `x-bnhub-growth-secret` (primary) or `x-cron-secret` (legacy admin cron routes).
 */
function getProvidedAutomationSecret(request: NextRequest): string | null {
  return (
    request.headers.get("x-bnhub-growth-secret")?.trim() ||
    request.headers.get("x-cron-secret")?.trim() ||
    null
  );
}

export function verifyBnhubGrowthAutomationRequest(request: NextRequest): boolean {
  const secret = getProvidedAutomationSecret(request);
  const expected = process.env.BNHUB_GROWTH_CRON_SECRET?.trim();
  if (!expected || !secret) return false;
  try {
    const a = Buffer.from(secret, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unauthorizedGrowthAutomation(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
