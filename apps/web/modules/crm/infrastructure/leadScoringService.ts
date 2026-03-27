import type { Lead } from "@prisma/client";
import type { LecipmScoreBreakdown } from "../domain/eliteLead";

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Urgency: intent, engagement, recency (deterministic).
 */
export function computeUrgencyScore(lead: Pick<Lead, "highIntent" | "engagementScore" | "createdAt" | "lastFollowUpAt">): number {
  const days = (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 40 - Math.min(40, days * 1.2));
  const intent = lead.highIntent ? 35 : 0;
  const eng = Math.min(25, lead.engagementScore * 0.25);
  return clamp(intent + eng + recency);
}

/**
 * Combine sub-scores into a single 0–100 lead priority score.
 */
export function combineLecipmScores(input: {
  trustScore: number | null;
  dealQualityScore: number | null;
  urgencyScore: number;
  legacyScore: number;
}): LecipmScoreBreakdown {
  const t = input.trustScore ?? 50;
  const d = input.dealQualityScore ?? 50;
  const u = input.urgencyScore;
  const l = clamp(input.legacyScore);

  const leadScore = clamp(0.32 * t + 0.33 * d + 0.22 * u + 0.13 * l);

  return {
    leadScore,
    dealQualityScore: clamp(d),
    trustScore: clamp(t),
    urgencyScore: clamp(u),
  };
}
