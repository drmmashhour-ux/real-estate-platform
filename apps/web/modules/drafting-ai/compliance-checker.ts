import type { Deal } from "@prisma/client";
import { runContractIntelligence } from "@/modules/contract-intelligence/contract-intelligence.engine";
import type { ContractIntelligenceIssue } from "@/modules/contract-intelligence/contract-intelligence.types";
import { runComplianceScan } from "@/modules/compliance/compliance-engine";

export type ComplianceDraftingResult = {
  issues: ContractIntelligenceIssue[];
  disclaimer: string;
  generatedAt: string;
};

/** Contract intelligence + structural compliance heuristics (assistive). */
export async function runComplianceForDealDrafting(deal: Deal): Promise<ComplianceDraftingResult> {
  const [ci, extra] = await Promise.all([runContractIntelligence(deal), runComplianceScan(deal)]);
  return {
    issues: [...ci.issues, ...extra.issues],
    disclaimer: `${ci.disclaimer} ${extra.disclaimer}`.trim(),
    generatedAt: new Date().toISOString(),
  };
}
