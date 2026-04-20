/**
 * Aggregated payload for admin APIs & dashboard sections — no throws.
 */

import { growthIntelligenceFlags } from "@/config/feature-flags";
import { runAllGrowthDetectors } from "./detectors/growth-detector-registry";
import {
  buildGrowthDashboardSummary,
  buildGrowthFunnelSummary,
  buildGrowthRegionOpportunitySummary,
  buildGrowthTrustLeverageSummary,
  buildGrowthTrendSummary,
} from "./growth-dashboard.service";
import {
  buildGrowthOpportunities,
  summarizeGrowthSignals,
} from "./growth-opportunity.service";
import {
  buildGrowthPrioritySummary,
  prioritizeGrowthOpportunities,
} from "./growth-priority.service";
import type { GrowthSignal } from "./growth.types";
import { buildGrowthSnapshot } from "./growth-snapshot-builder.service";

export async function getGrowthIntelligencePayload(params: {
  locale: string;
  country: string;
}): Promise<
  | { enabled: false }
  | {
      enabled: true;
      summary: ReturnType<typeof buildGrowthDashboardSummary>;
      signals: ReturnType<typeof summarizeGrowthSignals>["signals"];
      opportunities: ReturnType<typeof buildGrowthOpportunities>;
      priorities: ReturnType<typeof buildGrowthPrioritySummary>;
      regionOpportunities: ReturnType<typeof buildGrowthRegionOpportunitySummary>;
      funnel: ReturnType<typeof buildGrowthFunnelSummary>;
      trustLeverage: ReturnType<typeof buildGrowthTrustLeverageSummary>;
      trends: ReturnType<typeof buildGrowthTrendSummary>;
      timelineSignals: GrowthSignal[];
      availabilityNotes: string[];
      snapshotId: string;
      collectedAt: string;
      flags: typeof growthIntelligenceFlags;
    }
> {
  if (!growthIntelligenceFlags.growthIntelligenceV1) {
    return { enabled: false };
  }

  try {
    const snapshot = await buildGrowthSnapshot({
      locale: params.locale,
      country: params.country,
    });
    const rawSignals = runAllGrowthDetectors(snapshot);
    const summarized = summarizeGrowthSignals({ snapshot, signals: rawSignals });
    const opportunities = prioritizeGrowthOpportunities(
      buildGrowthOpportunities({ snapshot, signals: summarized.signals })
    );
    const priorities = buildGrowthPrioritySummary(opportunities);
    const summary = buildGrowthDashboardSummary({
      snapshotId: snapshot.id,
      collectedAt: snapshot.collectedAt,
      signals: summarized.signals,
      opportunities,
      availabilityNotes: snapshot.availabilityNotes,
    });

    return {
      enabled: true,
      summary,
      signals: summarized.signals,
      opportunities,
      priorities,
      regionOpportunities: buildGrowthRegionOpportunitySummary(opportunities),
      funnel: buildGrowthFunnelSummary(summarized.signals),
      trustLeverage: buildGrowthTrustLeverageSummary(summarized.signals),
      trends,
      timelineSignals,
      availabilityNotes: snapshot.availabilityNotes,
      snapshotId: snapshot.id,
      collectedAt: snapshot.collectedAt,
      flags: growthIntelligenceFlags,
    };
  } catch {
    return { enabled: false };
  }
}
