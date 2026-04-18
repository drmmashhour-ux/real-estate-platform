import type { Deal } from "@prisma/client";
import { runContractIntelligence } from "@/modules/contract-intelligence/contract-intelligence.engine";
import type { ContractIntelligenceIssue } from "@/modules/contract-intelligence/contract-intelligence.types";
import type { ValidationIssue } from "./validation.types";
import { workflowFormChecks } from "./workflow-check.service";

function fromCi(issue: ContractIntelligenceIssue): ValidationIssue {
  return {
    severity: issue.severity,
    code: issue.issueType,
    title: issue.title,
    summary: issue.summary,
    affectedFieldKeys: issue.affectedFieldKeys,
    suggestedAction: issue.suggestedFix,
    sourceReferences: [],
    brokerReviewRequired: true,
  };
}

export async function runFullDealValidation(deal: Deal): Promise<{ issues: ValidationIssue[]; disclaimer: string }> {
  const [ci, wf] = await Promise.all([runContractIntelligence(deal), Promise.resolve(workflowFormChecks(deal))]);
  return {
    issues: [...ci.issues.map(fromCi), ...wf],
    disclaimer: `${ci.disclaimer} Workflow hints are non-exhaustive.`,
  };
}
