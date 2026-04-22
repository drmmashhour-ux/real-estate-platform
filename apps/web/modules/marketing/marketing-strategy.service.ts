import { detectGrowthSignals } from "@/modules/growth-engine/growth-signal.service";

import {
  generateBNHubPost,
  generateListingPost,
  generateListingPostFromFsbo,
  generateLuxurySpotlightPost,
} from "./marketing-content.service";
import type { MarketingGeneratedContentVm } from "./marketing.types";
import { createDraftFromGenerated, hasRecentDuplicate } from "./marketing-scheduler.service";

/**
 * Uses growth signals + content templates to enqueue drafts (still subject to approval).
 */
export async function runMarketingStrategyFromGrowthEngine(): Promise<{
  draftsCreated: number;
  notes: string[];
}> {
  const notes: string[] = [];
  let draftsCreated = 0;

  const signals = await detectGrowthSignals().catch(() => []);
  const highViews = signals.filter((s) => s.signal === "high_views_low_booking").slice(0, 8);

  for (const sig of highViews) {
    try {
      let vm: MarketingGeneratedContentVm | null = null;
      if (sig.entityKind === "fsbo_listing" && sig.entityId) {
        vm = await generateListingPostFromFsbo(sig.entityId);
      } else if (sig.entityKind === "bnhub_listing" && sig.entityId) {
        vm = await generateBNHubPost(sig.entityId);
      } else if (sig.entityKind === "crm_listing" && sig.entityId) {
        vm = await generateListingPost(sig.entityId);
      }
      if (!vm) continue;
      if (await hasRecentDuplicate(vm)) {
        notes.push(`skip_dup:${sig.id}`);
        continue;
      }
      await createDraftFromGenerated(vm, { growthSignalRef: sig.id });
      draftsCreated += 1;
      notes.push(`draft:${sig.signal}:${sig.entityId}`);
    } catch (e: unknown) {
      notes.push(`err:${sig.id}:${e instanceof Error ? e.message : "x"}`);
    }
  }

  return { draftsCreated, notes };
}

export async function buildStrategyInsights(): Promise<string[]> {
  const signals = await detectGrowthSignals().catch(() => []);
  const perf = await import("./marketing-performance.service").then((m) => m.getMarketingPerformanceSummary());

  const insights: string[] = [];
  if (signals.some((s) => s.signal === "high_views_low_booking")) {
    insights.push("High-traffic listings with weak conversion — rotate creative angles (photos, price proof, BNHub perks).");
  }
  if (signals.some((s) => s.signal === "high_demand_low_supply")) {
    insights.push("Demand-heavy regions detected — prioritize spotlight + top-5 carousels for those cities.");
  }
  if (perf.bestPostId) {
    insights.push(`Best-performing tracked post in cohort: ${perf.bestPostId} — reuse hooks and timing.`);
  }
  if (perf.totalClicksApprox < 5 && perf.postsTracked > 3) {
    insights.push("Engagement is soft versus inventory — test LinkedIn for investor angles and Instagram Reels formats for BNHub.");
  }

  try {
    const lux = await generateLuxurySpotlightPost();
    insights.push(`Luxury narrative ready for ${lux.sourceKind}: ${lux.title.slice(0, 80)}`);
  } catch {
    /* ignore */
  }

  return insights.slice(0, 8);
}
