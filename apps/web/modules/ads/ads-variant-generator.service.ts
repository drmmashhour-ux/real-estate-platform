/**
 * Variant generation from a winning campaign — keeps core angle, varies hook/urgency/value.
 * Recommendation-only text for manual A/B tests in ad networks.
 */

import { adsAiAutomationFlags } from "@/config/feature-flags";
import { getCampaignMemory } from "./ads-automation-persistence.service";
import { getAdsLearningStore } from "./ads-learning-store";
import type { CampaignAdsMetrics } from "./ads-performance.service";

export type WinnerVariantBundle = {
  campaignKey: string;
  headlines: [string, string, string];
  primaryTexts: [string, string, string];
  ctaVariants: [string, string];
  audienceAngleVariants: [string, string];
  videoScriptShort: string;
  confidence: number;
  rationale: string;
  whyThisVariantSet?: string;
  learningSignalsUsed?: string[];
  warnings?: string[];
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export async function getVariantGenerationContextForCampaign(campaignKey: string): Promise<{
  bestHooks: string[];
  weakHooks: string[];
  bestCtas: string[];
  weakCtas: string[];
  fromDb: boolean;
}> {
  if (!adsAiAutomationFlags.aiAdsAutomationPersistenceV1) {
    const s = getAdsLearningStore();
    return {
      bestHooks: s.highPerformingHooks.slice(0, 6),
      weakHooks: s.lowPerformingHooks.slice(0, 6),
      bestCtas: s.bestCtaPhrases.slice(0, 6),
      weakCtas: s.weakCtaPhrases.slice(0, 6),
      fromDb: false,
    };
  }
  try {
    const mem = await getCampaignMemory(campaignKey);
    if (!mem) {
      const s = getAdsLearningStore();
      return {
        bestHooks: s.highPerformingHooks.slice(0, 6),
        weakHooks: s.lowPerformingHooks.slice(0, 6),
        bestCtas: s.bestCtaPhrases.slice(0, 6),
        weakCtas: s.weakCtaPhrases.slice(0, 6),
        fromDb: false,
      };
    }
    return {
      bestHooks: [...asStringArray(mem.bestHooks), ...getAdsLearningStore().highPerformingHooks].slice(0, 8),
      weakHooks: [...asStringArray(mem.weakHooks), ...getAdsLearningStore().lowPerformingHooks].slice(0, 8),
      bestCtas: [...asStringArray(mem.bestCtas), ...getAdsLearningStore().bestCtaPhrases].slice(0, 8),
      weakCtas: [...asStringArray(mem.weakCtas), ...getAdsLearningStore().weakCtaPhrases].slice(0, 8),
      fromDb: true,
    };
  } catch {
    const s = getAdsLearningStore();
    return {
      bestHooks: s.highPerformingHooks.slice(0, 6),
      weakHooks: s.lowPerformingHooks.slice(0, 6),
      bestCtas: s.bestCtaPhrases.slice(0, 6),
      weakCtas: s.weakCtaPhrases.slice(0, 6),
      fromDb: false,
    };
  }
}

function pickHook(pool: string[], fallback: string, avoid: Set<string>): string {
  for (const p of pool) {
    const t = p.trim();
    if (t && !avoid.has(t.toLowerCase())) return t;
  }
  return fallback;
}

function pickCta(pool: string[], fallback: string, avoid: Set<string>): string {
  for (const p of pool) {
    const t = p.trim();
    if (t && !avoid.has(t.toLowerCase())) return t;
  }
  return fallback;
}

export async function generateVariantsFromWinner(winner: CampaignAdsMetrics): Promise<WinnerVariantBundle> {
  const key = winner.campaignKey;
  const ctx = await getVariantGenerationContextForCampaign(key);
  const avoidCtas = new Set(ctx.weakCtas.map((c) => c.toLowerCase()));
  const avoidHooks = new Set(ctx.weakHooks.map((c) => c.toLowerCase()));

  const hookA = pickHook(ctx.bestHooks, "Still comparing options?", avoidHooks);
  const hookB = pickHook(ctx.bestHooks.slice(1), "Your next step on LECIPM", avoidHooks);

  const headlines: [string, string, string] = [
    `${hookA} · ${key}`,
    `Urgent: lock dates · ${key}`,
    `Value-first: verified path · ${key}`,
  ];

  const primaryTexts: [string, string, string] = [
    `${hookB} — duplicate this ad set with a tighter first line; keep landing identical for clean reads.`,
    `Social proof angle: highlight verified stays and Stripe-backed checkout — variant B for ${key}.`,
    `Soft ask: question-led opener vs statement-led; measure CTR delta only (no budget automation).`,
  ];

  const c1 = pickCta(ctx.bestCtas, "See matches", avoidCtas);
  const c2 = pickCta(ctx.bestCtas.slice(1), "Compare & book", avoidCtas);

  const ctaVariants: [string, string] = [c1, c2];

  const audienceAngleVariants: [string, string] = [
    `Interest stack: travel + short-term rental + ${key} keyword theme`,
    `Broad + retargeting overlay: site visitors 14d + similar intent`,
  ];

  const videoScriptShort = `0–3s: ${hookA} + logo. 3–12s: quick UI walkthrough of ${key} landing. CTA: manual paste only.`;

  const ctr = winner.ctrPercent ?? 0;
  const confidence = Math.min(0.95, 0.45 + Math.min(ctr / 10, 0.4) + (winner.clicks > 20 ? 0.1 : 0));

  const learningSignalsUsed = [
    ctx.fromDb ? "persisted_campaign_memory" : "in_memory_learning_store",
    ...ctx.bestHooks.slice(0, 2).map((h) => `hook:${h.slice(0, 48)}`),
  ];
  const warnings: string[] = [];
  if (ctx.weakCtas.length > 0) warnings.push("Skipped known weak CTA phrases from learning memory when possible.");

  return {
    campaignKey: key,
    headlines,
    primaryTexts,
    ctaVariants,
    audienceAngleVariants,
    videoScriptShort,
    confidence,
    rationale: `Derived from winner ${key}: preserve offer, test hook urgency vs value proof; confidence scales with CTR sample.`,
    whyThisVariantSet:
      "Hooks/CTAs blend in-memory highlights with durable campaign memory when persistence is enabled; weak phrases deprioritized.",
    learningSignalsUsed,
    warnings,
  };
}
