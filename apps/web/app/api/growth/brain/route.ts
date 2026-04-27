import { getGuestId } from "@/lib/auth/session";
import { getGrowthBrainActions, getGrowthBrainSummary } from "@/lib/growth/growthBrain";
import { flags } from "@/lib/flags";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/growth/brain — autonomous growth intelligence (recommendations only; no spend or messaging).
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!flags.AUTONOMOUS_AGENT) {
    return Response.json(
      {
        summary: null,
        actions: [] as const,
        message: "Autonomous growth brain is disabled.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const sessionUserId = await getGuestId();
    const [summary, actions] = await Promise.all([
      getGrowthBrainSummary(),
      getGrowthBrainActions(sessionUserId),
    ]);
    void trackEvent("growth_brain_viewed", { actionCount: actions.length }).catch(() => {});
    return Response.json({ summary, actions }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logError(e, { route: "/api/growth/brain" });
    return Response.json({ error: "Failed to load growth brain" }, { status: 500 });
  }
}
