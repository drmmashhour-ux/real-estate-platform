/**
 * Edge-safe API boundary checks (no Prisma). Used from `middleware.ts`.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { securityHardeningV1Flags } from "@/config/feature-flags";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { REQUEST_ID_HEADER } from "@/lib/middleware/request-logger";

const SKIP_GLOBAL_RATE = new Set([
  "/api/ready",
  "/api/health",
  "/api/stripe/webhook",
  "/api/internal/security/edge-event",
]);

const MAX_JSON_BYTES = 2 * 1024 * 1024; // 2 MiB — uploads use multipart (not limited here)
const MAX_QUERY_LEN = 12_000;

const SCANNER_UA_SUBSTR = ["sqlmap", "nikto", "acunetix", "nessus", "masscan", "nmap scripting"];

export function getClientIp(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (request.headers.get("x-real-ip") ?? "unknown").slice(0, 64);
}

/**
 * Returns a `NextResponse` when the request must be blocked; otherwise `null` (continue chain).
 */
export function runApiSecurityLayer(request: NextRequest): NextResponse | null {
  if (!securityHardeningV1Flags.securityGlobalV1) {
    return null;
  }

  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  if (SKIP_GLOBAL_RATE.has(pathname)) {
    return null;
  }

  const id = request.headers.get(REQUEST_ID_HEADER) ?? "";

  if (securityHardeningV1Flags.rateLimitV1) {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`sec:mw:api:${ip}`, { windowMs: 60_000, max: 600 });
    if (!rl.allowed) {
      const res = NextResponse.json(
        { error: "Too many requests", code: "SECURITY_RATE_LIMIT" },
        { status: 429, headers: getRateLimitHeaders(rl) },
      );
      if (id) res.headers.set(REQUEST_ID_HEADER, id);
      return res;
    }
  }

  const method = request.method.toUpperCase();
  const ct = request.headers.get("content-type") ?? "";

  if (method === "POST" && ct.includes("application/json") && !pathname.includes("/upload")) {
    const cl = request.headers.get("content-length");
    if (cl && /^\d+$/.test(cl) && Number(cl) > MAX_JSON_BYTES) {
      const res = NextResponse.json({ error: "Payload too large", code: "SECURITY_BODY_LIMIT" }, { status: 413 });
      if (id) res.headers.set(REQUEST_ID_HEADER, id);
      return res;
    }
  }

  const qs = request.nextUrl.search ?? "";
  if (qs.length > MAX_QUERY_LEN) {
    const res = NextResponse.json({ error: "Query too long", code: "SECURITY_QUERY_LIMIT" }, { status: 414 });
    if (id) res.headers.set(REQUEST_ID_HEADER, id);
    return res;
  }

  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  if (ua && SCANNER_UA_SUBSTR.some((s) => ua.includes(s))) {
    const res = NextResponse.json({ error: "Forbidden", code: "SECURITY_UA" }, { status: 403 });
    if (id) res.headers.set(REQUEST_ID_HEADER, id);
    return res;
  }

  return null;
}
