import type { PrismaClient } from "@prisma/client";
import { calculateTrustScore } from "@/modules/trust-score/application/calculateTrustScore";
import { calculateDealScore } from "@/modules/deal-score/application/calculateDealScore";
import { generateExplanation } from "@/modules/ai-explanations/generateExplanation";
import type { DecisionExplanation } from "@/modules/ai-explanations/generateExplanation";
import type { TrustScoreResult } from "@/modules/trust-score/domain/trustScore.types";
import type { DealScoreResult } from "@/modules/deal-score/domain/dealScore.types";

export type DecisionEngineResult = {
  trust: TrustScoreResult;
  deal: DealScoreResult;
  explanation: DecisionExplanation;
};

/**
 * Full pipeline: trust (persist) → deal analysis (persist) → explanation (deterministic + optional AI).
 */
export async function runDecisionEngine(db: PrismaClient, listingId: string): Promise<DecisionEngineResult | null> {
  const trust = await calculateTrustScore(db, listingId);
  if (!trust) return null;
  const deal = await calculateDealScore(listingId, { persist: true });
  if (!deal) return null;
  const explanation = await generateExplanation({ trust, deal });
  return { trust, deal, explanation };
}
