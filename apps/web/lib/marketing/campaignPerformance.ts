import "server-only";

import type { BrokerAdSimulationPerformance } from "@prisma/client";

import { getLegacyDB } from "@/lib/db/legacy";
import { runCampaignSimulationByCampaignId, type RunCampaignResult } from "@/lib/marketing/campaignEngine";
import { derivePerformanceMetrics } from "@/lib/marketing/campaignEnginePure";

const prisma = getLegacyDB();

/**
 * Order 86 — campaign performance (simulation-first, no live ad APIs).
 *
 * Persisted data uses existing `BrokerAdSimulationPerformance` (see `broker_ad_simulation_performances`)
 * and `BrokerAdSimulationCampaign` — same domain as `campaignEngine`, not a second parallel schema.
 */
export type CampaignMetrics = {
  impressions: number;
  clicks: number;
  conversions: number;
  /** Integer cents, derived from simulated `spend` (dollars) in the DB. */
  spendCents: number;
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
};

/**
 * Map a stored performance row to Order 86 metrics (CTR / CVR / cost per conv.).
 */
export function getCampaignMetricsFromPerformance(perf: BrokerAdSimulationPerformance): CampaignMetrics {
  const d = derivePerformanceMetrics(perf);
  return {
    impressions: d.impressions,
    clicks: d.clicks,
    conversions: d.conversions,
    spendCents: Math.max(0, Math.round(perf.spend * 100)),
    ctr: d.ctr,
    conversionRate: d.conversionRate,
    costPerConversion: d.costPerConversion,
  };
}

/**
 * Latest simulated performance for a campaign the user owns (or `null` if none).
 */
export async function getCampaignMetrics(
  campaignId: string,
  userId: string
): Promise<CampaignMetrics | null> {
  const row = await prisma.brokerAdSimulationPerformance.findFirst({
    where: { campaignId, campaign: { userId } },
  });
  if (!row) {
    return null;
  }
  return getCampaignMetricsFromPerformance(row);
}

/**
 * Run one simulation pass (inserts a performance row, completes campaign). Same as
 * `runCampaignSimulationByCampaignId` in {@link @/lib/marketing/campaignEngine}.
 */
export async function runCampaignSimulation(campaignId: string): Promise<RunCampaignResult> {
  return runCampaignSimulationByCampaignId(campaignId);
}
