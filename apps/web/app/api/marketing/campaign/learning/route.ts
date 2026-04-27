import { getGuestId } from "@/lib/auth/session";
import { getCampaignLearningSummary } from "@/lib/marketing/campaignLearning";
import { logError } from "@/lib/monitoring/errorLogger";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";

export const dynamic = "force-dynamic";

/**
 * GET /api/marketing/campaign/learning
 * Cross-campaign learning summary (simulated broker campaigns only). `userId` is derived from
 * the session (see {@link getGuestId}); query params are not trusted for identity.
 */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  if (searchParams.get("userId") && searchParams.get("userId") !== "me") {
    // Ignore arbitrary userIds — spec: actual id from session only.
  }
  try {
    const summary = await getCampaignLearningSummary(userId);
    void writeMarketplaceEvent("campaign_learning_viewed", {
      winningPatterns: summary.winningPatterns.length,
      weakPatterns: summary.weakPatterns.length,
    }).catch(() => {});
    return Response.json({ summary });
  } catch (e) {
    logError(e, { route: "/api/marketing/campaign/learning" });
    return Response.json({ error: "Failed to load learning summary" }, { status: 500 });
  }
}
