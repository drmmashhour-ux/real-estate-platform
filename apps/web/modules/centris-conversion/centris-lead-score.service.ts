import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

import { logConversion } from "./centris-funnel.log";

export type CentrisIntentLevel = "LOW" | "MEDIUM" | "HIGH";

export type CentrisLeadScoreResult = {
  score: number;
  intentLevel: CentrisIntentLevel;
  factors: string[];
};

/** Optional client-reported hints at capture time (privacy-safe aggregates). */
export type CentrisBehaviorHints = {
  dwellSeconds?: number;
  priorSessionViews?: number;
  returningVisitor?: boolean;
};

function intentFromScore(score: number): CentrisIntentLevel {
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MEDIUM";
  return "LOW";
}

function mergeAiExplanation(existing: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};
  return { ...base, ...patch };
}

/**
 * Deterministic Centris funnel score (0–100). Uses Lead + LeadTimelineEvent only — no duplicate CRM pipelines.
 */
export async function computeCentrisLeadScore(
  leadId: string,
  hints?: CentrisBehaviorHints | null,
): Promise<CentrisLeadScoreResult> {
  const factors: string[] = [];
  let raw = 32;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      distributionChannel: true,
      dealValue: true,
      estimatedValue: true,
      highIntent: true,
      createdAt: true,
      userId: true,
    },
  });

  const events = await prisma.leadTimelineEvent.findMany({
    where: { leadId },
    select: { eventType: true, payload: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Set<string>();
  for (const ev of events) {
    const d = ev.createdAt.toISOString().slice(0, 10);
    byDay.add(d);
  }
  const distinctDays = byDay.size;

  let viewCount = 0;
  let contactDepth = 0;
  let saveCount = 0;
  let bookingCount = 0;
  let analysisCount = 0;
  let priceCount = 0;
  let engagementCount = 0;

  for (const ev of events) {
    switch (ev.eventType) {
      case "FUNNEL_VIEW":
        viewCount++;
        break;
      case "FUNNEL_CONTACT":
        contactDepth++;
        {
          const intent = (ev.payload as Record<string, unknown> | null)?.intent;
          if (intent === "unlock_analysis") analysisCount++;
          if (intent === "book_visit") bookingCount++;
          if (intent === "download_report") engagementCount++;
        }
        break;
      case "FUNNEL_SAVE":
        saveCount++;
        break;
      case "FUNNEL_BOOKING":
        bookingCount++;
        break;
      case "FUNNEL_ANALYSIS":
        analysisCount++;
        break;
      case "FUNNEL_PRICE":
        priceCount++;
        break;
      case "FUNNEL_ENGAGEMENT":
        engagementCount++;
        break;
      default:
        break;
    }
  }

  if (lead?.distributionChannel === "CENTRIS") {
    raw += 6;
    factors.push("Centris-attributed session");
  }

  raw += Math.min(18, viewCount * 4);
  if (viewCount > 0) factors.push(`${viewCount} listing view signal(s)`);

  raw += Math.min(14, contactDepth * 7);
  if (contactDepth > 0) factors.push("Intent capture / contact");

  raw += Math.min(10, saveCount * 5);
  if (saveCount > 0) factors.push("Saved / shortlist signal");

  raw += Math.min(12, bookingCount * 6);
  if (bookingCount > 0) factors.push("Visit / booking interest");

  raw += Math.min(10, analysisCount * 5);
  if (analysisCount > 0) factors.push("Analysis engagement");

  raw += Math.min(8, priceCount * 4);
  if (priceCount > 0) factors.push("Price interaction");

  raw += Math.min(10, engagementCount * 3);
  if (engagementCount > 0) factors.push("Deep listing engagement");

  if (distinctDays >= 2) {
    raw += 12;
    factors.push("Repeat visits (multi-day)");
  } else if (hints?.returningVisitor) {
    raw += 8;
    factors.push("Returning visitor");
  }

  const dwell = hints?.dwellSeconds ?? 0;
  if (dwell >= 120) {
    raw += 10;
    factors.push("Extended time on listing");
  } else if (dwell >= 45) {
    raw += 5;
    factors.push("Moderate dwell time");
  }

  const priorViews = hints?.priorSessionViews ?? 0;
  raw += Math.min(8, priorViews * 2);
  if (priorViews > 0) factors.push("Prior listing interactions this session");

  const priceBand = Math.max(lead?.dealValue ?? 0, lead?.estimatedValue ?? 0);
  if (priceBand >= 900_000) {
    raw += 10;
    factors.push("Higher ticket listing band");
  } else if (priceBand >= 450_000) {
    raw += 5;
    factors.push("Mid-market listing band");
  }

  if (lead?.userId) {
    raw += 8;
    factors.push("Signed-in platform user");
  }

  if (lead?.highIntent) {
    raw += 5;
    factors.push("Legacy high-intent flag");
  }

  const score = Math.min(100, Math.max(0, Math.round(raw)));
  const intentLevel = intentFromScore(score);

  logConversion("lead_score_computed", { leadId, score, intentLevel });

  return { score, intentLevel, factors };
}

/** Writes score + structured explanation onto existing Lead row (merges aiExplanation.centris). */
export async function persistCentrisLeadScore(
  leadId: string,
  hints?: CentrisBehaviorHints | null,
): Promise<CentrisLeadScoreResult> {
  const computed = await computeCentrisLeadScore(leadId, hints);

  const existing = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { aiExplanation: true },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: computed.score,
      aiTier:
        computed.intentLevel === "HIGH" ? "hot" : computed.intentLevel === "MEDIUM" ? "warm" : "cold",
      aiExplanation: mergeAiExplanation(existing?.aiExplanation, {
        centris: {
          leadScore: computed.score,
          intentLevel: computed.intentLevel,
          factors: computed.factors,
          updatedAt: new Date().toISOString(),
        },
      }) as Prisma.InputJsonValue,
    },
  });

  logConversion("lead_score_persisted", { leadId, score: computed.score });
  return computed;
}
