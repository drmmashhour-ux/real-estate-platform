import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { logApi } from "@/lib/observability/structured-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Light process / runtime stats for health checks and on-call.
 * No DB queries; public with rate limit (abuse / overload guard).
 */
export async function GET(req: Request) {
  const ip = getClientIpFromRequest(req);
  const rl = checkRateLimit(`system-status:${ip}`, { windowMs: 60_000, max: 120 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", ...getRateLimitHeaders(rl) },
    });
  }
  const mem = process.memoryUsage();
  logApi("system_status");
  return Response.json(
    {
      ok: true,
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
      node: process.version,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
