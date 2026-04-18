import { getLastAdsAutomationLoopRun, type AdsAutomationLoopResult } from "@/modules/ads/ads-automation-loop.service";
import { getLearningMemoryHighlights } from "@/modules/ads/ads-learning-store.service";
import { platformCoreFlags } from "@/config/feature-flags";
import { ingestAdsV4RunToPlatformCore } from "./ads-v4.bridge";
import { ingestAdsLandingInsights } from "./ads-landing.bridge";
import { ingestAdsLearningPatterns } from "./ads-learning.bridge";

export async function runAdsV4PlatformCoreIngestion(run?: AdsAutomationLoopResult | null) {
  if (!platformCoreFlags.platformCoreV1 || !platformCoreFlags.platformCoreAdsIngestionV1) {
    return { status: "disabled" as const };
  }

  const r = run ?? getLastAdsAutomationLoopRun();
  if (!r) {
    return { status: "no_run" as const };
  }

  const mem = getLearningMemoryHighlights();
  const learningLines = [...mem.topHooks.slice(0, 4), ...mem.topAudiences.slice(0, 3)].filter(Boolean);

  const decisionResult = await ingestAdsV4RunToPlatformCore(r, learningLines);
  await ingestAdsLandingInsights(r.landing);
  await ingestAdsLearningPatterns(getLearningMemoryHighlights());

  return {
    status: "ok" as const,
    decisions: decisionResult.ingested,
  };
}
