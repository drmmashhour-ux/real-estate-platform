import { prisma } from "@/lib/db";

/**
 * Audit trail when a would-be candidate is skipped (cooldown, sampled dedupe, policy block).
 * Reasons include `cooldown_user`, `cooldown_audience`, `dedupe_recent_candidate` (sampled), etc.
 */
export async function logCampaignSuppression(input: {
  userId?: string | null;
  sessionKey?: string | null;
  campaignKind: string;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.campaignSuppressionLog.create({
    data: {
      userId: input.userId ?? undefined,
      sessionId: input.sessionKey ?? undefined,
      campaignKind: input.campaignKind,
      reason: input.reason.slice(0, 256),
      metadataJson: {
        ...(input.metadata ?? {}),
        loggedAt: new Date().toISOString(),
      },
    },
  });
}
