import { requireAdminSession } from "@/lib/admin/require-admin";
import { runLaunchAudit } from "@/lib/launch/readinessAudit";
import { getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/launch/readiness — admin-only full-system audit (Order 60).
 */
export async function GET(req: Request) {
  const ip = getClientIpFromRequest(req);
  const rl = checkRateLimit(`launch-readiness:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", ...getRateLimitHeaders(rl) },
    });
  }

  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: "Admin only" }, { status: admin.status });
  }

  const result = await runLaunchAudit();
  void trackEvent("launch_readiness_checked", {
    score: result.score,
    criticalPass: result.criticalPass,
  }).catch(() => {});

  return Response.json(result);
}
