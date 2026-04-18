import { prisma } from "@/lib/db";
import type { ComplianceRuleHit } from "./compliance-rules.types";

export async function runRepresentationRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      brokerId: true,
      leadContactOrigin: true,
    },
  });
  if (!deal) return [];

  const out: ComplianceRuleHit[] = [];

  if (deal.brokerId && deal.buyerId === deal.sellerId) {
    out.push({
      ruleKey: "representation.buyer_seller_same_user",
      caseType: "representation_risk",
      severity: "high",
      title: "Buyer and seller user IDs match",
      summary:
        "The deal references the same platform user as buyer and seller. This may be test data or a data issue — requires supervisory review.",
      reasons: ["buyerId === sellerId"],
      affectedEntities: [{ type: "deal", id: deal.id }],
      suggestedActions: ["Validate parties against the official brokerage file"],
      findingType: "identity_collision",
    });
  }

  return out;
}
