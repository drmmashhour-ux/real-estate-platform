import "server-only";

import { derivePerformanceMetrics } from "@/lib/marketing/campaignEnginePure";
import type { CampaignFeedbackInsights } from "@/lib/marketing/campaignFeedbackTypes";
import { aggregateCampaignFeedbackFromRows, type FeedbackRow } from "@/lib/marketing/campaignFeedbackPure";
import { getLegacyDB } from "@/lib/db/legacy";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { generateAdCopy, type AdAudience } from "@/lib/marketing/adCopyEngine";

const prisma = getLegacyDB();

/**
 * Order 88 — auto-feedback from simulated campaign performance (no live ad APIs, no campaign mutations).
 */
export async function getCampaignFeedbackInsights(userId: string): Promise<CampaignFeedbackInsights> {
  const rows = await prisma.brokerAdSimulationCampaign.findMany({
    where: { userId },
    include: { performanceRows: { take: 1, orderBy: { createdAt: "desc" } } },
  });

  const feedbackRows: FeedbackRow[] = [];
  for (const c of rows) {
    const perf = c.performanceRows[0];
    if (!perf) {
      continue;
    }
    const m = derivePerformanceMetrics(perf);
    feedbackRows.push({
      platform: c.platform,
      audience: c.audience,
      city: c.city,
      ctr: m.ctr,
      conversionRate: m.conversionRate,
      conversions: m.conversions,
    });
  }

  const out = aggregateCampaignFeedbackFromRows(feedbackRows);
  if (out.campaignsAnalyzed > 0) {
    void writeMarketplaceEvent("campaign_feedback_generated", {
      bestPlatform: out.bestPlatform,
      bestAudience: out.bestAudience,
      campaigns: out.campaignsAnalyzed,
    }).catch(() => {});
  }
  return out;
}

/**
 * Loads feedback insights and returns {@link generateAdCopy} with optional `learnedVariant` (feedback) when eligible.
 */
export async function generateAdCopyWithFeedback(input: {
  audience: AdAudience;
  city?: string;
  userId: string;
}): Promise<ReturnType<typeof generateAdCopy>> {
  const feedbackInsights = await getCampaignFeedbackInsights(input.userId);
  const out = generateAdCopy({
    audience: input.audience,
    city: input.city,
    feedbackInsights,
  });
  if (feedbackInsights.eligible && feedbackInsights.bestPlatform) {
    void writeMarketplaceEvent("campaign_feedback_applied", {
      platform: feedbackInsights.bestPlatform,
      audience: input.audience,
    }).catch(() => {});
  }
  return out;
}

/** Re-export for API layers that import from one place. */
export { CAMPAIGN_FEEDBACK_MIN_CAMPAIGNS } from "@/lib/marketing/campaignFeedbackTypes";
export type { CampaignFeedbackInsights } from "@/lib/marketing/campaignFeedbackTypes";
