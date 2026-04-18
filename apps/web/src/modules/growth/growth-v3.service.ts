import { syncTopicClustersFromOpportunities } from "./seo-v3/topic-cluster.service";
import { generateInternalLinkSuggestions } from "./seo-v3/internal-linking.service";
import { queueStaleSeoRefreshJobs } from "./seo-v3/seo-refresh.service";
import { captureFlywheelSnapshot } from "@/src/modules/flywheel/flywheel.engine";
import { suggestAutoExperiments, evaluateRunningExperimentsAuto } from "@/src/modules/experiments/experiments-auto.service";
import { prioritizeRevenueListings } from "@/src/modules/revenue-growth/revenue-prioritization.service";
import { scanReferralEngagementTriggers } from "./referrals/referral-engine-v3.service";

export type GrowthV3ScanSummary = {
  topicClusters: { upserts: number };
  internalLinks: { inserted: number };
  seoRefresh: { queued: number };
  flywheel: { id: string } | null;
  experiments: { suggested: number; eval: { snapshots: number; warnings: string[] } };
  revenue: Awaited<ReturnType<typeof prioritizeRevenueListings>>;
  referral: { inserted: number };
};

/**
 * Batch runner for Growth Autopilot v3 — each submodule gates on its own feature flag.
 */
export async function runGrowthV3Scan(): Promise<GrowthV3ScanSummary> {
  const [topicClusters, internalLinks, seoRefresh, flywheel, expSuggest, expEval, revenue, referral] =
    await Promise.all([
      syncTopicClustersFromOpportunities(),
      generateInternalLinkSuggestions(),
      queueStaleSeoRefreshJobs(),
      captureFlywheelSnapshot(),
      suggestAutoExperiments(),
      evaluateRunningExperimentsAuto(),
      prioritizeRevenueListings(25),
      scanReferralEngagementTriggers(),
    ]);

  return {
    topicClusters,
    internalLinks,
    seoRefresh,
    flywheel,
    experiments: { suggested: expSuggest.created, eval: expEval },
    revenue,
    referral,
  };
}
