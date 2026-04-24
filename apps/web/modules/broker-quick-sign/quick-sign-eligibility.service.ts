import { prisma } from "@/lib/db";

export type QuickSignTier = "low" | "high";

export type QuickSignEligibility = {
  tier: QuickSignTier;
  reasons: string[];
};

/**
 * High-risk deals must use the full execution approval flow (`/api/deals/[id]/execute/approve`)
 * with validation readiness — quick sign is blocked.
 */
export async function assessBrokerQuickSignEligibility(dealId: string): Promise<QuickSignEligibility> {
  const reasons: string[] = [];

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      status: true,
      riskLevel: true,
      possibleBypassFlag: true,
      qaReviews: {
        where: { status: { in: ["draft", "pending", "in_progress"] } },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!deal) {
    return { tier: "high", reasons: ["Deal not found"] };
  }

  if (deal.status === "closed" || deal.status === "cancelled") {
    reasons.push("Deal is terminal — no new execution approval.");
  }

  if ((deal.riskLevel ?? "").toUpperCase() === "HIGH") {
    reasons.push("Deal risk level is HIGH — use full approval with validation.");
  }

  if (deal.possibleBypassFlag) {
    reasons.push("Compliance flag: possible lead bypass — full broker review required.");
  }

  if (deal.qaReviews.length > 0) {
    reasons.push("Open QA review on file — complete review before quick approval.");
  }

  const seriousCompliance = await prisma.complianceCase.count({
    where: {
      dealId,
      severity: { in: ["high", "critical"] },
      status: { notIn: ["resolved", "dismissed", "archived"] },
    },
  });
  if (seriousCompliance > 0) {
    reasons.push("Open high-severity compliance case — use full signature / approval flow.");
  }

  return {
    tier: reasons.length > 0 ? "high" : "low",
    reasons,
  };
}
