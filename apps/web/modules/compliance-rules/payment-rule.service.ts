import { prisma } from "@/lib/db";
import type { ComplianceRuleHit } from "./compliance-rules.types";

export async function runPaymentRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const [payments, openConditions] = await Promise.all([
    prisma.lecipmDealPayment.findMany({
      where: { dealId },
      select: { id: true, status: true, paymentKind: true },
      take: 40,
    }),
    prisma.dealClosingCondition.count({
      where: { dealId, status: { notIn: ["fulfilled", "waived", "released"] } },
    }),
  ]);

  const released = payments.filter((p) => p.status === "released" || p.status === "refunded");
  if (released.length > 0 && openConditions > 0) {
    return [
      {
        ruleKey: "payment.release_with_open_conditions",
        caseType: "payment_workflow_risk",
        severity: "high",
        title: "Payment movement while closing conditions remain open",
        summary:
          "Ledger shows released/refunded payment rows while non-cleared closing conditions exist. Verify trust/policy alignment.",
        reasons: [
          `Released-like payment rows: ${released.length}`,
          `Open closing conditions: ${openConditions}`,
        ],
        affectedEntities: released.slice(0, 5).map((p) => ({ type: "lecipm_deal_payment", id: p.id })),
        suggestedActions: ["Confirm condition status with broker and notary coordination"],
        findingType: "payment_condition_mismatch",
      },
    ];
  }

  return [];
}
