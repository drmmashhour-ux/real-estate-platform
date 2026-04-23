import { format, startOfWeek } from "date-fns";

import type {
  ContentAudience,
  ContentGoal,
  ContentPlatform,
  ContentType,
} from "@/modules/marketing-content/content-calendar.types";
import { listContentItems } from "@/modules/marketing-content/content-calendar.service";

import { generateMarketingPack } from "./marketing-ai-generator.service";
import {
  analyzePerformanceInsights,
  buildPlannerWeights,
  rankItemsForInsights,
} from "./marketing-ai-optimizer.service";
import { distributeWeeklySlots, suggestPostingSlot } from "./marketing-ai-scheduler.service";
import type { PlannedSlot, PlannerWeights, PostingTimeSlot, WeeklyPlan } from "./marketing-ai.types";
import { getLearningState } from "./marketing-ai-learning.service";
import { uid } from "./marketing-ai-storage";

const TOPICS = [
  "pipeline velocity without spam",
  "trust-first listings",
  "BNHub stay economics",
  "investor-grade underwriting",
  "buyer clarity in noisy feeds",
  "broker leverage vs portals",
  "conversion from DM to booked call",
  "repeat referral loops",
  "short-form proof points",
  "neighbourhood momentum",
] as const;

const PLATFORMS: ContentPlatform[] = ["INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"];
const TYPES: ContentType[] = ["VIDEO", "POSTER", "TEXT"];
const AUDIENCES: ContentAudience[] = ["BROKER", "INVESTOR", "BUYER", "GENERAL"];

function weightedPick<T extends string>(
  keys: T[],
  weights: Partial<Record<T, number>>,
  salt: number
): T {
  let best = keys[salt % keys.length]!;
  let bestScore = -Infinity;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[(i + salt) % keys.length]!;
    const w = weights[k] ?? 1;
    const jitter = (((salt * 31 + i * 17) % 100) + 1) / 200;
    const s = w + jitter;
    if (s > bestScore) {
      bestScore = s;
      best = k;
    }
  }
  return best;
}

/** Blend optimizer weights with persisted learning multipliers */
function mergeLearning(weights: PlannerWeights): PlannerWeights {
  const L = getLearningState();
  const platform: Partial<Record<ContentPlatform, number>> = { ...weights.platform };
  const audience: Partial<Record<ContentAudience, number>> = { ...weights.audience };
  const type: Partial<Record<ContentType, number>> = { ...weights.type };
  const slot = { ...weights.slot };

  for (const [k, v] of Object.entries(L.platformScores)) {
    if (typeof v === "number") {
      const key = k as ContentPlatform;
      platform[key] = (platform[key] ?? 1) * (0.75 + v * 0.5);
    }
  }
  for (const [k, v] of Object.entries(L.audienceScores)) {
    if (typeof v === "number") {
      const key = k as ContentAudience;
      audience[key] = (audience[key] ?? 1) * (0.75 + v * 0.5);
    }
  }
  for (const [k, v] of Object.entries(L.typeScores)) {
    if (typeof v === "number") {
      const key = k as ContentType;
      type[key] = (type[key] ?? 1) * (0.75 + v * 0.5);
    }
  }
  for (const [k, v] of Object.entries(L.slotScores)) {
    if (typeof v === "number") {
      const key = k as "morning" | "evening";
      slot[key] = (slot[key] ?? 1) * (0.8 + v * 0.4);
    }
  }

  return { platform, audience, type, slot };
}

export type GenerateWeeklyPlanOptions = {
  /** Total planned slots for the week (spread across days) */
  slotsTotal?: number;
  /** Skip attaching generated copy (plan structure only) */
  dryCopy?: boolean;
};

/**
 * Builds a 7-day plan (Mon-start week) mixing platforms/types/audiences,
 * anti-clustering via scheduler + performance-informed weights.
 */
export function generateWeeklyPlan(
  anchorDate = new Date(),
  opts: GenerateWeeklyPlanOptions = {}
): WeeklyPlan {
  const items = listContentItems();
  const ranked = rankItemsForInsights(items);
  const insights = analyzePerformanceInsights(items);
  let weights = buildPlannerWeights(insights, ranked);
  weights = mergeLearning(weights);

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekStartIso = format(weekStart, "yyyy-MM-dd");

  const totalSlots = opts.slotsTotal ?? 10;
  const assignments = distributeWeeklySlots(totalSlots);
  const slots: PlannedSlot[] = [];
  const takenPerDay = new Map<number, PostingTimeSlot[]>();

  let i = 0;
  for (const a of assignments) {
    const dayTaken = takenPerDay.get(a.dayOffset) ?? [];
    const suggestedSlot = suggestPostingSlot(a.dayOffset, dayTaken, weights.slot);
    dayTaken.push(suggestedSlot);
    takenPerDay.set(a.dayOffset, dayTaken);

    const platform = weightedPick(PLATFORMS, weights.platform, i);
    const contentType = weightedPick(TYPES, weights.type, i + 3);
    const audience = weightedPick(AUDIENCES, weights.audience, i + 5);

    const goal: ContentGoal =
      insights.avgLeadsPerPosted >= 0.75
        ? i % 4 === 0
          ? "AWARENESS"
          : "LEADS"
        : i % 3 === 1
          ? "CONVERSION"
          : "LEADS";

    const topic = TOPICS[(i + a.dayOffset * 2) % TOPICS.length]!;
    const trendHint = insights.bestPlatforms[0];

    const generated = opts.dryCopy
      ? undefined
      : generateMarketingPack({
          audience,
          goal,
          topic,
          trend: trendHint,
        });

    slots.push({
      id: uid(),
      dayOffset: a.dayOffset,
      platform,
      contentType,
      audience,
      goal,
      suggestedSlot,
      topic,
      generated,
    });
    i++;
  }

  return {
    weekStartIso,
    slots,
    generatedAtIso: new Date().toISOString(),
    plannerVersion: "marketing-ai-planner@v1",
  };
}
