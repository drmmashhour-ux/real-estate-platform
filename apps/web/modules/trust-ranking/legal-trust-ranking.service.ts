/**
 * Legal + trust marketplace ranking — bounded multipliers; deterministic.
 */

import type { PropertyPublishComplianceSummary } from "@/modules/legal/scoring/property-legal-risk.types";
import type { TrustScore } from "@/modules/trust/trust.types";
import type { LegalTrustRankingImpact, RankingDecisionSummary } from "./legal-trust-ranking.types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export type LegalTrustRankingParams = {
  listingId: string;
  trustScore?: TrustScore | null;
  /** Optional trust badges count for boost cap */
  strongTrustBadgeCount?: number;
  publishSummary: PropertyPublishComplianceSummary | null;
  /** When true listing is not yet cleared for publish */
  prepublishBlocked?: boolean;
  /** Already live in catalog */
  isPublishedVisible?: boolean;
};

/**
 * Computes bounded multiplier from trust + legal readiness / risk signals.
 */
export function computeLegalTrustRankingImpact(params: LegalTrustRankingParams): LegalTrustRankingImpact {
  try {
    const reasons: string[] = [];
    const listingId = params.listingId;
    let trustBoost = 0;

    const t = params.trustScore?.score ?? 52;
    if (t >= 82) {
      trustBoost = 0.08;
      reasons.push("Strong trust index — small positive ranking weight.");
    } else if (t >= 68) {
      trustBoost = 0.04;
      reasons.push("Moderate trust index — slight positive ranking weight.");
    } else if (t <= 40) {
      trustBoost = -0.04;
      reasons.push("Lower trust index — slight dampening.");
    }

    const badges = typeof params.strongTrustBadgeCount === "number" ? params.strongTrustBadgeCount : 0;
    if (badges >= 3 && t >= 72) {
      trustBoost += 0.03;
      reasons.push("Multiple trust confirmations — capped boost.");
    }

    trustBoost = clamp(trustBoost, -0.08, 0.12);

    const summary = params.publishSummary;
    const lr = summary?.legalRiskScore ?? 35;
    const readiness = summary?.readinessScore ?? 70;

    let legalRiskMultiplier = 1;

    if (params.prepublishBlocked === true && params.isPublishedVisible !== true) {
      legalRiskMultiplier = 0;
      reasons.push("Pre-publish gate blocked — catalog exposure restricted until resolved.");
      return finalizeImpact(listingId, trustBoost, legalRiskMultiplier, reasons);
    }

    if (lr >= 80) {
      legalRiskMultiplier = 0.65;
      reasons.push("High legal risk index — strong dampening.");
    } else if (lr >= 60) {
      legalRiskMultiplier = clamp(0.72 + (75 - lr) / 200, 0.6, 0.78);
      reasons.push("Elevated legal risk — dampened visibility.");
    } else if (lr >= 45) {
      legalRiskMultiplier = clamp(0.85 + (60 - lr) / 400, 0.82, 0.93);
      reasons.push("Guarded legal risk — mild dampening.");
    } else if (lr <= 25 && readiness >= 85 && t >= 72) {
      legalRiskMultiplier = clamp(1.06 + Math.min(0.08, (readiness - 85) / 120), 1.05, 1.14);
      reasons.push("Low legal friction with strong readiness/trust — capped boost.");
    } else {
      legalRiskMultiplier = 1;
      reasons.push("Neutral legal/trust adjustment band.");
    }

    legalRiskMultiplier = clamp(legalRiskMultiplier, 0.55, 1.14);

    return finalizeImpact(listingId, trustBoost, legalRiskMultiplier, reasons);
  } catch {
    return finalizeImpact(params.listingId, 0, 1, ["Ranking impact fallback — neutral band applied."]);
  }
}

function finalizeImpact(
  listingId: string,
  trustBoost: number,
  legalRiskMultiplier: number,
  reasons: string[],
): LegalTrustRankingImpact {
  const combined = clamp((1 + trustBoost) * legalRiskMultiplier, 0, 1.18);
  let exposureLevel: LegalTrustRankingImpact["exposureLevel"] = "normal";
  if (combined <= 0.02) exposureLevel = "restricted";
  else if (combined >= 1.06) exposureLevel = "boosted";

  return {
    listingId,
    trustBoost,
    legalRiskMultiplier,
    finalMultiplier: combined,
    exposureLevel,
    reasons,
  };
}

export function applyLegalTrustRanking(baseScore: number, impact: LegalTrustRankingImpact): RankingDecisionSummary {
  const bs = Number.isFinite(baseScore) ? baseScore : 0;
  const fs = clamp(bs * impact.finalMultiplier, 0, 1e9);
  return {
    listingId: impact.listingId,
    baseScore: bs,
    finalScore: fs,
    impact,
  };
}
