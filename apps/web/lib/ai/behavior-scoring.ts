/**
 * Behavior-based lead score from AiUserActivityLog (rule-based).
 * Weights are transparent; tune without claiming ML predictions.
 */

import { prisma } from "@/lib/db";
import { tierFromScore, type LeadTier } from "./lead-tier";

const WINDOW_DAYS = 30;

export type BehaviorScoreBreakdown = {
  searchEvents: number;
  listingViews: number;
  savedListings: number;
  messagesSent: number;
  repeatVisitDays: number;
  totalDurationSeconds: number;
  pointsFromRules: { key: string; points: number }[];
  rawScore: number;
};

function daysAgo(d: Date): number {
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
}

export async function computeBehaviorScoreBreakdown(userId: string): Promise<BehaviorScoreBreakdown> {
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);

  const logs = await prisma.aiUserActivityLog.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });

  let searchEvents = 0;
  let listingViews = 0;
  let savedListings = 0;
  let messagesSent = 0;
  let totalDurationSeconds = 0;
  const visitDays = new Set<string>();

  for (const row of logs) {
    const day = row.createdAt.toISOString().slice(0, 10);
    visitDays.add(day);
    switch (row.eventType) {
      case "search":
        searchEvents += 1;
        break;
      case "listing_view":
        listingViews += 1;
        break;
      case "listing_save":
        savedListings += 1;
        break;
      case "message_sent":
        messagesSent += 1;
        break;
      default:
        break;
    }
    if (row.durationSeconds && row.durationSeconds > 0) {
      totalDurationSeconds += Math.min(row.durationSeconds, 3600);
    }
  }

  const pointsFromRules: { key: string; points: number }[] = [];
  let raw = 10;

  if (searchEvents >= 5) {
    raw += 25;
    pointsFromRules.push({ key: "search_frequency_5+", points: 25 });
  } else if (searchEvents >= 2) {
    raw += 12;
    pointsFromRules.push({ key: "search_frequency_2+", points: 12 });
  }

  if (listingViews >= 5) {
    raw += 25;
    pointsFromRules.push({ key: "listing_views_5+", points: 25 });
  } else if (listingViews >= 2) {
    raw += 10;
    pointsFromRules.push({ key: "listing_views_2+", points: 10 });
  }

  if (savedListings >= 1) {
    raw += 15;
    pointsFromRules.push({ key: "saved_listing", points: 15 });
  }

  if (messagesSent >= 1) {
    raw += 15;
    pointsFromRules.push({ key: "message_sent", points: 15 });
  }

  const repeatVisitDays = visitDays.size;
  if (repeatVisitDays >= 5) {
    raw += 15;
    pointsFromRules.push({ key: "repeat_visits_5+_days", points: 15 });
  } else if (repeatVisitDays >= 3) {
    raw += 8;
    pointsFromRules.push({ key: "repeat_visits_3+_days", points: 8 });
  }

  const engagedMinutes = totalDurationSeconds / 60;
  if (engagedMinutes >= 30) {
    raw += 10;
    pointsFromRules.push({ key: "time_on_site_30m+", points: 10 });
  } else if (engagedMinutes >= 10) {
    raw += 5;
    pointsFromRules.push({ key: "time_on_site_10m+", points: 5 });
  }

  raw = Math.min(100, Math.max(0, raw));

  return {
    searchEvents,
    listingViews,
    savedListings,
    messagesSent,
    repeatVisitDays,
    totalDurationSeconds,
    pointsFromRules,
    rawScore: raw,
  };
}

export async function refreshUserAiProfile(userId: string): Promise<{
  behaviorLeadScore: number;
  behaviorTier: LeadTier;
  breakdown: BehaviorScoreBreakdown;
}> {
  const breakdown = await computeBehaviorScoreBreakdown(userId);
  const behaviorTier = tierFromScore(breakdown.rawScore);

  await prisma.userAiProfile.upsert({
    where: { userId },
    create: {
      userId,
      behaviorLeadScore: breakdown.rawScore,
      behaviorTier,
      scoreBreakdown: breakdown as object,
    },
    update: {
      behaviorLeadScore: breakdown.rawScore,
      behaviorTier,
      scoreBreakdown: breakdown as object,
    },
  });

  return { behaviorLeadScore: breakdown.rawScore, behaviorTier, breakdown };
}

/** Merge form score (0–100) and behavior score with weights — explainable. */
export function mergeFormAndBehaviorScore(formScore: number, behaviorScore: number): {
  merged: number;
  weights: { form: number; behavior: number };
} {
  const f = Math.min(100, Math.max(0, formScore));
  const b = Math.min(100, Math.max(0, behaviorScore));
  const merged = Math.round(f * 0.55 + b * 0.45);
  return { merged, weights: { form: 0.55, behavior: 0.45 } };
}
