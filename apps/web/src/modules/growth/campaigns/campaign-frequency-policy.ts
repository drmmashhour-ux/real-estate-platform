import { prisma } from "@/lib/db";
import { GROWTH_V2 } from "../growth-v2.constants";

function cooldownHours(campaignKind: string): number {
  const map = GROWTH_V2.CAMPAIGN_COOLDOWN_HOURS_BY_KIND as Record<string, number>;
  return map[campaignKind] ?? map.default;
}

/**
 * Checks `CampaignSuppressionLog` for recent entries (after sends, blocks, or explicit caps).
 * `sessionKey` is stored as `CampaignSuppressionLog.sessionId` (audience-scoped key, not a browser session).
 * Lead/listing **dedupe** without a prior send is handled via `hasRecentCampaignCandidate` — not this query.
 * Per-“channel” caps in this module map 1:1 to `campaignKind` (e.g. `broker_followup`, `host_optimization_reminder`).
 */
export async function isAudienceWithinCampaignCooldown(input: {
  userId?: string | null;
  /** When `userId` is absent, scope cooldown to e.g. `lead:cuid` / `listing:cuid` (matches `session_id`). */
  sessionKey?: string | null;
  campaignKind: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const hours = cooldownHours(input.campaignKind);
  const since = new Date(Date.now() - hours * 3600000);

  if (input.userId) {
    const recent = await prisma.campaignSuppressionLog.findFirst({
      where: { userId: input.userId, campaignKind: input.campaignKind, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) return { ok: false, reason: "cooldown_user" };
  }

  if (input.sessionKey) {
    const recent = await prisma.campaignSuppressionLog.findFirst({
      where: { sessionId: input.sessionKey, campaignKind: input.campaignKind, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });
    if (recent) return { ok: false, reason: "cooldown_audience" };
  }

  return { ok: true };
}

/** @deprecated Prefer `isAudienceWithinCampaignCooldown` with `sessionKey` when no user id. */
export async function isUserWithinCampaignCooldown(
  userId: string | null | undefined,
  campaignKind: string
): Promise<{ ok: boolean; reason?: string }> {
  return isAudienceWithinCampaignCooldown({ userId, campaignKind });
}
