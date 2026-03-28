import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { hashApiKey } from "@/src/api/apiKeyCrypto";
import type { PublicApiKeyContext, PlatformPartner } from "@/src/api/types";
import { assertWithinMonthlyQuota } from "@/src/modules/monetization/apiBilling";
import { requestsPerMinuteForPlan } from "@/src/modules/monetization/apiBilling";

function extractBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes("admin:*");
}

export type AuthResult =
  | { ok: true; ctx: PublicApiKeyContext }
  | { ok: false; response: NextResponse };

/**
 * Validate Bearer API key, scopes, monthly quota, and per-key rate limit.
 */
export async function authenticatePublicApi(req: NextRequest, requiredScope: string): Promise<AuthResult> {
  const token = extractBearer(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing or invalid Authorization Bearer token" }, { status: 401 }),
    };
  }

  const keyHash = hashApiKey(token);
  const ext = prisma as unknown as {
    platformPublicApiKey?: {
      findUnique: (args: object) => Promise<(PublicApiKeyContext["key"] & { partner: PlatformPartner | null }) | null>;
      update: (args: object) => Promise<unknown>;
    };
  };
  const store = ext.platformPublicApiKey;
  if (!store) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Public API keys are not configured (run migrations)" }, { status: 503 }),
    };
  }

  const key = await store.findUnique({
    where: { keyHash },
    include: { partner: true },
  });

  if (!key || !key.active) {
    return { ok: false, response: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) };
  }

  if (!hasScope(key.scopes, requiredScope)) {
    return { ok: false, response: NextResponse.json({ error: "Insufficient scope" }, { status: 403 }) };
  }

  const quota = await assertWithinMonthlyQuota(key.id);
  if (!quota.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Monthly API quota exceeded", usage: quota.usage, quota: quota.quota },
        { status: 402 }
      ),
    };
  }

  const rpm = requestsPerMinuteForPlan(key.billingPlan);
  const rl = checkRateLimit(`papi:${key.id}`, { windowMs: 60_000, max: rpm });
  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: getRateLimitHeaders(rl) }),
    };
  }

  return { ok: true, ctx: { key } };
}

export async function recordApiCall(keyId: string) {
  const ext = prisma as unknown as {
    platformPublicApiKey?: { update: (args: object) => Promise<unknown> };
  };
  try {
    await ext.platformPublicApiKey?.update({
      where: { id: keyId },
      data: { usageCount: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }
}
