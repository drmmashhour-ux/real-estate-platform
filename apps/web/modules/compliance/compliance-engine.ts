import type { Deal } from "@prisma/client";
import type { ContractIntelligenceIssue } from "@/modules/contract-intelligence/contract-intelligence.types";
import { detectStructuralRisks } from "./risk-detector";

export type ComplianceScanResult = {
  issues: ContractIntelligenceIssue[];
  disclaimer: string;
};

/**
 * Aggregates compliance-oriented prompts for drafting workspace (heuristic; broker judgment required).
 */
export async function runComplianceScan(deal: Deal): Promise<ComplianceScanResult> {
  const issues = detectStructuralRisks(deal);
  return {
    issues,
    disclaimer: "Compliance scan is assistive and non-exhaustive — not a substitute for supervision or legal counsel.",
  };
}
