import type { ContentItem } from "@/modules/marketing-content/content-calendar.types";

import type { LearningState, PostingTimeSlot } from "./marketing-ai.types";
import { loadMarketingAiStore, saveMarketingAiStore } from "./marketing-ai-storage";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function engagementNorm(it: ContentItem): number {
  const p = it.performance;
  const raw = p.views / 5000 + p.clicks / 200 + p.leads * 0.25 + p.revenueCents / 500_000;
  return clamp01(raw);
}

/** Extract a coarse hook template key for scoring */
export function hookTemplateKey(hook: string): string {
  const h = hook.trim().slice(0, 48).toLowerCase().replace(/\s+/g, " ");
  const bucket = h.slice(0, 24);
  return bucket || "default";
}

export function ingestPostedPerformance(items: ContentItem[]): LearningState {
  const posted = items.filter((i) => i.status === "POSTED");
  const store = loadMarketingAiStore();
  let L = { ...store.learning };

  const alpha = 0.25;
  for (const it of posted) {
    const scoreDelta = engagementNorm(it);
    L.samples += 1;

    L.platformScores[it.platform] = rolling(L.platformScores[it.platform], scoreDelta, alpha);
    L.typeScores[it.type] = rolling(L.typeScores[it.type], scoreDelta, alpha);
    L.audienceScores[it.audience] = rolling(L.audienceScores[it.audience], scoreDelta, alpha);

    const hk = hookTemplateKey(it.hook || it.title);
    L.hookTemplateScores[hk] = rolling(L.hookTemplateScores[hk], scoreDelta, alpha);

    const slotGuess: PostingTimeSlot =
      it.scheduledDate && Number(it.scheduledDate.split("-")[2]) % 2 === 1 ? "evening" : "morning";
    L.slotScores[slotGuess] = rolling(L.slotScores[slotGuess], scoreDelta, alpha * 0.8);
  }

  L.updatedAtIso = new Date().toISOString();
  store.learning = L;
  saveMarketingAiStore(store);
  return L;
}

function rolling(prev: number | undefined, observation: number, alpha: number): number {
  const base = prev ?? observation;
  return base * (1 - alpha) + observation * alpha;
}

export function getLearningState(): LearningState {
  return loadMarketingAiStore().learning;
}
