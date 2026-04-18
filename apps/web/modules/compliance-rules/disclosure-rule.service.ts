import { prisma } from "@/lib/db";
import type { ComplianceRuleHit } from "./compliance-rules.types";

/** Heuristic checks for disclosure / notice tracking — not a legal sufficiency test. */
export async function runDisclosureRules(dealId: string): Promise<ComplianceRuleHit[]> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      dealExecutionType: true,
      dealParties: { take: 5 },
      documents: { take: 20, select: { id: true, type: true, workflowStatus: true } },
    },
  });
  if (!deal) return [];

  const out: ComplianceRuleHit[] = [];

  if (deal.dealExecutionType && deal.dealParties.length === 0) {
    out.push({
      ruleKey: "disclosure.execution_type_without_parties",
      caseType: "missing_disclosure",
      severity: "medium",
      title: "Execution profile without recorded parties",
      summary:
        "A deal execution type is set but no deal parties are linked. Confirm representation and disclosure workflows in your brokerage records.",
      reasons: ["dealExecutionType is populated", "dealParties count is zero"],
      affectedEntities: [{ type: "deal", id: deal.id }],
      suggestedActions: ["Verify party records in the official file", "Add internal notes for supervisory follow-up"],
      findingType: "party_record_gap",
    });
  }

  const hasSellerDecl = deal.documents.some((d) => d.type.toLowerCase().includes("seller") && d.type.toLowerCase().includes("decl"));
  if (deal.dealExecutionType === "residential_sale" && !hasSellerDecl) {
    out.push({
      ruleKey: "disclosure.seller_declaration_not_detected",
      caseType: "missing_disclosure",
      severity: "low",
      title: "Seller declaration document not detected in platform row set",
      summary:
        "No document type matching seller declaration was found. This is a platform scan only — the executed form may exist outside the upload set.",
      reasons: ["Residential sale profile", "No matching document type keyword"],
      affectedEntities: [{ type: "deal", id: deal.id }],
      suggestedActions: ["Confirm seller declaration status with the responsible broker"],
      findingType: "document_keyword_miss",
    });
  }

  return out;
}
