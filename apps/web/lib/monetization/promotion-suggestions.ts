import { prisma } from "@/lib/db";

export type BnhubPromotionAiSuggestion = {
  suggestDiscount: boolean;
  suggestBoost: boolean;
  confidence: number;
  reason: string;
};

/**
 * Rule-based “AI” suggestion for discounts vs boosted placement using stored demand score.
 */
export async function suggestBnhubPromotionActions(
  supabaseListingId: string
): Promise<BnhubPromotionAiSuggestion> {
  const id = supabaseListingId.trim();
  if (!id) {
    return { suggestDiscount: false, suggestBoost: false, confidence: 0, reason: "missing_listing" };
  }

  const row = await prisma.bnhubListingDemandScore.findUnique({
    where: { supabaseListingId: id },
    select: { score: true, factorsJson: true },
  });
  const score = row?.score ?? 45;

  if (score < 38) {
    return {
      suggestDiscount: true,
      suggestBoost: false,
      confidence: 72,
      reason: "Demand is soft — a time-boxed discount can lift conversion.",
    };
  }
  if (score > 78) {
    return {
      suggestDiscount: false,
      suggestBoost: true,
      confidence: 68,
      reason: "Strong interest — consider a boost to capture premium demand.",
    };
  }
  return {
    suggestDiscount: false,
    suggestBoost: false,
    confidence: 55,
    reason: "Balanced demand — hold pricing; monitor views for 48h.",
  };
}
