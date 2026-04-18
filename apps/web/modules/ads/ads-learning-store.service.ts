/**
 * Facade for automation loop + dashboard — hybrid in-memory cache + optional DB durability.
 */

import { adsAiAutomationFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import type { ClassifiedAdsBuckets } from "./ads-learning-classifier.service";
import type { CampaignClassificationWithEvidence } from "./ads-learning-classifier.service";
import {
  incrementLoopPatternDeltas,
  type LoopPatternDelta,
  upsertCampaignMemory,
  type CampaignMemoryUpsert,
} from "./ads-automation-persistence.service";
import {
  getAdsLearningStore,
  mergeExternalLearningLines,
  recordBestAudience,
  recordBestObjectiveForSegment,
  recordHighPerformingHook,
  recordLosingHeadline,
  recordLowPerformingHook,
  recordWeakAudience,
  type AdsLearningSnapshot,
  type ObjectiveSegmentKey,
} from "./ads-learning-store";

export type LearningMemoryHighlights = {
  topHooks: string[];
  hooksToAvoid: string[];
  topAudiences: string[];
  weakAudiences: string[];
  topCtas: string[];
  weakCtas: string[];
  objectivesBySegment: { segment: ObjectiveSegmentKey; objective: string }[];
};

let hydrated = false;
let lastHydratedAt: string | null = null;
let lastPersistedAt: string | null = null;

export function getLearningMemoryHighlights(): LearningMemoryHighlights {
  const s = getAdsLearningStore();
  return {
    topHooks: s.highPerformingHooks.slice(0, 5),
    hooksToAvoid: s.lowPerformingHooks.slice(0, 5),
    topAudiences: s.bestAudiences.slice(0, 5),
    weakAudiences: s.weakAudiences.slice(0, 5),
    topCtas: s.bestCtaPhrases.slice(0, 5),
    weakCtas: s.weakCtaPhrases.slice(0, 5),
    objectivesBySegment: s.bestObjectiveBySegment.slice(0, 8),
  };
}

/** Fold winner/loser buckets into memory for future creative + test-plan bias (in-process). */
export function ingestClassifiedCampaigns(buckets: ClassifiedAdsBuckets): void {
  for (const w of buckets.winnerCampaigns) {
    recordBestAudience(`Winner · ${w.campaignKey} · CTR ${w.ctrPercent ?? "—"}%`);
    recordHighPerformingHook(`Scale candidate: ${w.campaignKey}`);
    if (w.leads > 0) recordBestObjectiveForSegment("lead", `Lead efficiency · ${w.campaignKey}`);
    if (w.bookingsCompleted > 0) recordBestObjectiveForSegment("booking", `Bookings · ${w.campaignKey}`);
  }
  for (const weak of buckets.weakCampaigns) {
    recordLosingHeadline(`Weak · ${weak.campaignKey}`);
    recordWeakAudience(`Review · ${weak.campaignKey}`);
    recordLowPerformingHook(`Paused angle · ${weak.campaignKey}`);
  }
}

export function buildPatternDeltasFromBuckets(buckets: ClassifiedAdsBuckets): LoopPatternDelta[] {
  const deltas: LoopPatternDelta[] = [];
  for (const w of buckets.winnerCampaigns) {
    deltas.push({
      patternType: "utm_campaign",
      patternKey: w.campaignKey,
      sentiment: "loop_winner",
      incrementWin: 1,
    });
    deltas.push({
      patternType: "hook_memo",
      patternKey: `Scale candidate: ${w.campaignKey}`,
      sentiment: "positive",
      incrementWin: 1,
    });
  }
  for (const x of buckets.weakCampaigns) {
    deltas.push({
      patternType: "utm_campaign",
      patternKey: x.campaignKey,
      sentiment: "loop_weak",
      incrementWeak: 1,
    });
  }
  for (const u of buckets.uncertainCampaigns) {
    deltas.push({
      patternType: "utm_campaign",
      patternKey: u.campaignKey,
      sentiment: "loop_uncertain",
      incrementUncertain: 1,
    });
  }
  return deltas;
}

export function buildCampaignMemoryUpserts(
  buckets: ClassifiedAdsBuckets,
  evidence: CampaignClassificationWithEvidence[],
): CampaignMemoryUpsert[] {
  const evMap = new Map(evidence.map((e) => [e.campaign.campaignKey, e]));
  const rows: CampaignMemoryUpsert[] = [];
  const all: Array<{ key: string; role: "winner" | "weak" | "uncertain" }> = [
    ...buckets.winnerCampaigns.map((c) => ({ key: c.campaignKey, role: "winner" as const })),
    ...buckets.weakCampaigns.map((c) => ({ key: c.campaignKey, role: "weak" as const })),
    ...buckets.uncertainCampaigns.map((c) => ({ key: c.campaignKey, role: "uncertain" as const })),
  ];
  for (const { key, role } of all) {
    const ev = evMap.get(key);
    rows.push({
      campaignKey: key,
      campaignLabel: key,
      primaryObjective: role === "winner" ? "scale_candidate" : role === "weak" ? "review_or_pause" : "gather_data",
      bestHooks: role === "winner" ? [`Scale candidate: ${key}`] : undefined,
      weakHooks: role === "weak" ? [`Paused angle: ${key}`] : undefined,
      bestAudiences: role === "winner" ? [`Winner · ${key}`] : undefined,
      weakAudiences: role === "weak" ? [`Review · ${key}`] : undefined,
      geoInsights: ev?.geoSummary ?? undefined,
      metadata: {
        role,
        evidenceScore: ev?.evidenceScore,
        campaignKeyTrace: key,
      },
      lastClassifiedAt: new Date(),
    });
  }
  return rows;
}

export async function hydrateLearningStoreFromDb(): Promise<void> {
  if (!adsAiAutomationFlags.aiAdsAutomationPersistenceV1) return;
  try {
    const rows = await prisma.adsLearningCampaignMemory.findMany({
      orderBy: { updatedAt: "desc" },
      take: 80,
    });
    for (const m of rows) {
      const bh = m.bestHooks;
      const wh = m.weakHooks;
      const bc = m.bestCtas;
      const wc = m.weakCtas;
      const ba = m.bestAudiences;
      const wa = m.weakAudiences;
      if (Array.isArray(bh)) mergeExternalLearningLines(bh.filter((x) => typeof x === "string") as string[], "high_hook");
      if (Array.isArray(wh)) mergeExternalLearningLines(wh.filter((x) => typeof x === "string") as string[], "low_hook");
      if (Array.isArray(bc)) mergeExternalLearningLines(bc.filter((x) => typeof x === "string") as string[], "best_cta");
      if (Array.isArray(wc)) mergeExternalLearningLines(wc.filter((x) => typeof x === "string") as string[], "weak_cta");
      if (Array.isArray(ba)) mergeExternalLearningLines(ba.filter((x) => typeof x === "string") as string[], "best_audience");
      if (Array.isArray(wa)) mergeExternalLearningLines(wa.filter((x) => typeof x === "string") as string[], "weak_audience");
    }

    const patterns = await prisma.adsLearningPatternSnapshot.findMany({
      where: { patternType: "hook_memo", sentiment: "positive" },
      orderBy: { score: "desc" },
      take: 40,
    });
    for (const p of patterns) {
      mergeExternalLearningLines([p.patternKey], "high_hook");
    }

    hydrated = true;
    lastHydratedAt = new Date().toISOString();
  } catch {
    hydrated = false;
  }
}

export async function persistLearningStoreSnapshots(
  buckets: ClassifiedAdsBuckets,
  evidence: CampaignClassificationWithEvidence[],
): Promise<{ ok: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  if (!adsAiAutomationFlags.aiAdsAutomationPersistenceV1) {
    return { ok: true, warnings };
  }
  try {
    const deltas = buildPatternDeltasFromBuckets(buckets);
    await incrementLoopPatternDeltas(deltas);
    const mem = buildCampaignMemoryUpserts(buckets, evidence);
    await upsertCampaignMemory(mem);
    lastPersistedAt = new Date().toISOString();
    return { ok: true, warnings };
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : "learning_persist_failed");
    return { ok: false, warnings };
  }
}

export function getLearningStoreHealth(): {
  hydrated: boolean;
  cacheEntries: number;
  lastHydratedAt?: string | null;
  lastPersistedAt?: string | null;
} {
  const s = getAdsLearningStore();
  const cacheEntries =
    s.highPerformingHooks.length +
    s.lowPerformingHooks.length +
    s.bestCtaPhrases.length +
    s.weakCtaPhrases.length +
    s.bestAudiences.length +
    s.weakAudiences.length;
  return {
    hydrated,
    cacheEntries,
    lastHydratedAt,
    lastPersistedAt,
  };
}

export function snapshotForDashboard(): AdsLearningSnapshot {
  return getAdsLearningStore();
}
