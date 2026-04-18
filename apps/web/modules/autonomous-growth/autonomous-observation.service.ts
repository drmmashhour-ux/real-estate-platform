import { engineFlags, marketplaceIntelligenceFlags, oneBrainV2Flags, platformCoreFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { buildAssistantRecommendationFeed } from "@/modules/operator/assistant-aggregator.service";
import type { AssistantFeedResponse } from "@/modules/operator/assistant-aggregator.service";
import { getPlatformCoreHealth } from "@/modules/platform-core/platform-health.service";
import type { BrainSnapshotPayload } from "@/modules/platform-core/brain-snapshot.service";
import type { PlatformCoreHealth } from "@/modules/platform-core/platform-health.service";
import type { AutonomousDomain, AutonomousSystemSnapshot } from "./autonomous-growth.types";

export type AutonomousObservationResult = {
  snapshot: AutonomousSystemSnapshot;
  raw: {
    assistantFeed: AssistantFeedResponse | null;
    brainSnapshot: BrainSnapshotPayload | null;
    platformCoreHealth: PlatformCoreHealth | null;
    latestPortfolioRun: { id: string; createdAt: Date } | null;
  };
};

function domainSetFromFeed(feed: AssistantFeedResponse | null): Set<AutonomousDomain> {
  const domains = new Set<AutonomousDomain>();
  if (!feed) return domains;
  const collect = (list: { source: string }[]) => {
    for (const r of list) {
      if (r.source === "ADS") domains.add("ADS");
      else if (r.source === "CRO") domains.add("CRO");
      else if (r.source === "RETARGETING") domains.add("RETARGETING");
      else if (r.source === "AB_TEST") domains.add("AB_TEST");
      else if (r.source === "PROFIT") domains.add("PROFIT");
      else if (r.source === "PORTFOLIO") domains.add("PORTFOLIO");
      else if (r.source === "MARKETPLACE") domains.add("MARKETPLACE");
      else if (r.source === "UNIFIED") domains.add("UNIFIED");
    }
  };
  collect(feed.topRecommendations);
  collect(feed.monitoringOnly);
  for (const { recommendation } of feed.blockedRecommendations) collect([recommendation]);
  return domains;
}

/**
 * Aggregates latest persisted / current subsystem outputs without recomputing heavy models.
 * Missing domains produce warnings; observation continues.
 */
export async function buildAutonomousObservationSnapshot(): Promise<AutonomousObservationResult> {
  const warnings: string[] = [];
  const observedAt = new Date().toISOString();

  let assistantFeed: AssistantFeedResponse | null = null;
  if (engineFlags.growthMachineV1) {
    try {
      assistantFeed = await buildAssistantRecommendationFeed({ persist: false });
      if (assistantFeed.subsystemWarnings.length > 0) {
        warnings.push(...assistantFeed.subsystemWarnings);
      }
    } catch (e) {
      warnings.push(`assistant_feed: ${e instanceof Error ? e.message : "unavailable"}`);
    }
  } else {
    warnings.push("growth_machine_disabled: set FEATURE_GROWTH_MACHINE_V1 for full assistant aggregation.");
  }

  let brainSnapshot: BrainSnapshotPayload | null = null;
  if (platformCoreFlags.platformCoreV1 && oneBrainV2Flags.oneBrainV2AdaptiveV1) {
    try {
      const { buildBrainSnapshot } = await import("@/modules/platform-core/brain-snapshot.service");
      brainSnapshot = await buildBrainSnapshot();
    } catch (e) {
      warnings.push(`one_brain_snapshot: ${e instanceof Error ? e.message : "unavailable"}`);
    }
  }

  let platformCoreHealth: PlatformCoreHealth | null = null;
  if (platformCoreFlags.platformCoreV1) {
    try {
      platformCoreHealth = await getPlatformCoreHealth();
      warnings.push(...platformCoreHealth.warnings);
    } catch (e) {
      warnings.push(`platform_core_health: ${e instanceof Error ? e.message : "unavailable"}`);
    }
  } else {
    warnings.push("platform_core_disabled: queue health omitted (FEATURE_PLATFORM_CORE_V1).");
  }

  let latestPortfolioRun: { id: string; createdAt: Date } | null = null;
  try {
    latestPortfolioRun = await prisma.portfolioOptimizationRun.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });
  } catch {
    warnings.push("portfolio_latest_run: unavailable");
  }

  const domainSet = domainSetFromFeed(assistantFeed);
  if (platformCoreHealth) domainSet.add("PLATFORM_CORE");
  if (brainSnapshot) domainSet.add("UNIFIED");
  if (latestPortfolioRun) domainSet.add("PORTFOLIO");
  if (marketplaceIntelligenceFlags.marketplaceIntelligenceV1) domainSet.add("MARKETPLACE");

  const domains = [...domainSet].sort();

  const recCount =
    assistantFeed?.summaryCounts.total ??
    (assistantFeed ?
      assistantFeed.topRecommendations.length +
        assistantFeed.blockedRecommendations.length +
        assistantFeed.monitoringOnly.length
    : 0);

  const snapshot: AutonomousSystemSnapshot = {
    observedAt,
    domains,
    recommendationCount: recCount,
    decisionCount: platformCoreHealth ? platformCoreHealth.pendingDecisions + platformCoreHealth.blockedDecisions : 0,
    executableCount: assistantFeed?.summaryCounts.top ?? 0,
    blockedCount: assistantFeed?.summaryCounts.blocked ?? 0,
    approvalRequiredCount: 0,
    warnings: [...new Set(warnings)],
  };

  return {
    snapshot,
    raw: {
      assistantFeed,
      brainSnapshot,
      platformCoreHealth,
      latestPortfolioRun,
    },
  };
}
