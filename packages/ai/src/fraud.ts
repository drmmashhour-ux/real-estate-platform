/**
 * AI Fraud Detection – wrap existing fraud logic, flag anomalies, auto-trigger alerts.
 */
import {
  computeFraudScore,
  computeFraudScoreFromSignals,
  evaluateAndStoreFraudScore,
  getFraudScore,
} from "@/lib/ai-fraud";
import { runFraudCheckForListing } from "@/lib/anti-fraud/services/check-listing";
import { logAiDecision } from "./logger";

export type FraudCheckResult = {
  riskScore: number; // 0-100
  trustLevel: "low" | "medium" | "high";
  recommendedAction: "allow" | "review" | "block";
  factors: string[];
  alertsTriggered?: boolean;
};

function scoreToTrustLevel(riskScore: number): "low" | "medium" | "high" {
  if (riskScore >= 70) return "low";
  if (riskScore >= 30) return "medium";
  return "high";
}

export async function fraudCheckListing(
  listingId: string,
  options?: { store?: boolean; log?: boolean }
): Promise<FraudCheckResult> {
  const result = await runFraudCheckForListing(listingId);
  const riskScore = result.fraudScore;
  const trustLevel = scoreToTrustLevel(riskScore);
  const recommendedAction =
    riskScore >= 70 ? "block" : riskScore >= 40 ? "review" : "allow";

  if (options?.log !== false) {
    await logAiDecision({
      action: "fraud_check",
      entityType: "listing",
      entityId: listingId,
      riskScore,
      trustLevel,
      details: {
        factors: result.reasons,
        frozen: result.frozen,
        recommendedAction,
      },
    });
  }

  const factors = result.reasons.map(
    (r) => `${r.signal}${r.detail ? ` (${r.detail})` : ""}`
  );
  return {
    riskScore,
    trustLevel,
    recommendedAction,
    factors,
    alertsTriggered: result.frozen,
  };
}

export async function fraudCheckEntity(params: {
  entityType: "BOOKING" | "USER" | "listing";
  entityId: string;
  signals?: { type: string; score: number }[];
  store?: boolean;
  log?: boolean;
}): Promise<FraudCheckResult> {
  const { entityType, entityId, signals, store = false, log = true } = params;

  if (entityType === "listing") {
    return fraudCheckListing(entityId, { store, log });
  }

  let score: number;
  let factors: Record<string, number>;

  if (signals && signals.length > 0) {
    const result = computeFraudScoreFromSignals(signals);
    score = result.score;
    factors = result.factors;
  } else {
    const result = await computeFraudScore({
      entityType,
      entityId,
    });
    score = result.score;
    factors = result.factors;
  }

  const riskScore = Math.round(score * 100);
  const trustLevel = scoreToTrustLevel(riskScore);
  const recommendedAction =
    riskScore >= 70 ? "block" : riskScore >= 40 ? "review" : "allow";
  const factorList = Object.entries(factors).map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`);

  if (store) {
    await evaluateAndStoreFraudScore({
      entityType,
      entityId,
      signalIds: undefined,
      logDecision: true,
    });
  }

  if (log) {
    await logAiDecision({
      action: "fraud_check",
      entityType: entityType.toLowerCase(),
      entityId,
      riskScore,
      trustLevel,
      details: { factors: factorList, recommendedAction },
    });
  }

  return {
    riskScore,
    trustLevel,
    recommendedAction,
    factors: factorList.length > 0 ? factorList : ["No strong signals"],
  };
}

export { getFraudScore } from "@/lib/ai-fraud";
export async function getListingFraudScore(listingId: string) {
  const row = await getFraudScore("LISTING", listingId);
  if (!row) return null;
  return {
    riskScore: Math.round(row.score * 100),
    factors: row.factors as Record<string, number> | null,
    priority: row.priority,
    createdAt: row.createdAt,
  };
}
