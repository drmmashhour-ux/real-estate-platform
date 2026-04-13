/**
 * Distributed rate limits (Redis when `REDIS_URL` set) + optional IP cooldown + security logs.
 * For public spam-prone POST routes (contact, waitlist, password reset, etc.).
 */
import { NextResponse } from "next/server";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";
import { logSecurityEvent } from "@/lib/observability/security-events";
import { trackRateLimitPersisted } from "@/lib/security/security-events";
import { fingerprintClientIp, getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { isSecurityIpBlocked } from "@/lib/security/ip-block";
import type { RateLimitOptions } from "@/lib/rate-limit";
import {
  checkRateLimitDistributed,
  getRateLimitHeadersFromResult,
  isIpRateLimitBlocked,
  maybeBlockIpAfterRateLimitDenied,
} from "@/lib/rate-limit-distributed";

export { getClientIpFromRequest, fingerprintClientIp };

export type DistributedRateLimitGateResult =
  | { allowed: true; responseHeaders: Record<string, string> }
  | { allowed: false; response: NextResponse };

/**
 * Single check: returns headers to merge on success (e.g. X-RateLimit-*), or a 429 response.
 */
export async function gateDistributedRateLimit(
  req: { headers: Headers },
  keyPrefix: string,
  options: RateLimitOptions
): Promise<DistributedRateLimitGateResult> {
  const ip = getClientIpFromRequest(req);
  const fp = fingerprintClientIp(ip);
  const requestId = req.headers.get(REQUEST_ID_HEADER);

  if (await isSecurityIpBlocked(fp)) {
    return {
      allowed: false,
      response: NextResponse.json({ error: "Access denied." }, { status: 403 }),
    };
  }

  if (await isIpRateLimitBlocked(fp)) {
    trackRateLimitPersisted({
      detail: `${keyPrefix}_blocked_fingerprint`,
      ipFingerprint: fp,
      requestId,
    });
    return {
      allowed: false,
      response: NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 }),
    };
  }

  const limit = await checkRateLimitDistributed(`${keyPrefix}:${ip}`, options);
  if (!limit.allowed) {
    if (process.env.RATE_LIMIT_IP_BLOCK === "1") {
      void maybeBlockIpAfterRateLimitDenied(fp);
    }
    logSecurityEvent({
      event: "rate_limit_exceeded",
      detail: keyPrefix,
      subjectHint: fp,
      requestId,
    });
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        { status: 429, headers: getRateLimitHeadersFromResult(limit) }
      ),
    };
  }

  return { allowed: true, responseHeaders: getRateLimitHeadersFromResult(limit) };
}
