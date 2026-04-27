import { getMarketplaceBrainActions, getMarketplaceBrainSummary } from "@/lib/ai/marketplaceBrain";
import { flags } from "@/lib/flags";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/marketplace-brain — central marketplace intelligence (recommendations only; no writes).
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
        message: "Autonomous marketplace brain is disabled.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const [summary, actions] = await Promise.all([getMarketplaceBrainSummary(), getMarketplaceBrainActions()]);
    return Response.json({ summary, actions }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logError(e, { route: "/api/ai/marketplace-brain" });
    return Response.json({ error: "Failed to load marketplace brain" }, { status: 500 });
  }
}
