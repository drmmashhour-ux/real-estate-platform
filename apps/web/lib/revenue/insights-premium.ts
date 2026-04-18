import { prisma } from "@/lib/db";
import { getRevenueControlSettings } from "@/modules/revenue/revenue-control-settings";
import {
  isRevenueDashboardV1Enabled,
  isRevenueEnforcementV1Enabled,
} from "@/modules/revenue/revenue-enforcement-flags";
import { trackRevenueEvent } from "@/modules/revenue/revenue-events.service";

/**
 * Premium AI insights (advanced deal / investor layers). When monetization is off, all authenticated users are treated as premium for insights.
 */
export async function isLecipmAiInsightsPremiumUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const [settings, user] = await Promise.all([
    getRevenueControlSettings(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lecipmAiInsightsPremiumUntil: true },
    }),
  ]);
  if (!settings.monetizationEnabled) return true;
  const until = user?.lecipmAiInsightsPremiumUntil;
  const granted = until != null && until.getTime() > Date.now();
  if (isRevenueEnforcementV1Enabled() || isRevenueDashboardV1Enabled()) {
    trackRevenueEvent({
      type: "premium_insight_viewed",
      userId,
      metadata: {
        source: "insights",
        accessGranted: granted,
      },
    });
  }
  return granted;
}
