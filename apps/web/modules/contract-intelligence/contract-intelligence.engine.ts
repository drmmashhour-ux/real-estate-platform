import type { Deal } from "@prisma/client";
import { dealExecutionFlags } from "@/config/feature-flags";
import { buildClauseSuggestionsFromLibrary } from "./clause-suggestion.service";
import { detectPartyConsistency } from "./consistency-check.service";
import type { ContractIntelligenceRunResult } from "./contract-intelligence.types";
import { detectPriceDepositConflicts } from "./conflict-check.service";
import { detectDeadlineIssues } from "./deadline-check.service";
import { draftingDisclaimerNote } from "./drafting-note.service";
import { detectMissingInfo } from "./missing-info-check.service";
import { coownershipRiskPrompts } from "./risk-prompt.service";

export async function runContractIntelligence(deal: Deal): Promise<ContractIntelligenceRunResult> {
  if (!dealExecutionFlags.contractIntelligenceV1) {
    return {
      issues: [],
      generatedAt: new Date().toISOString(),
      disclaimer: "Contract intelligence disabled by feature flag.",
    };
  }

  const issues = [
    draftingDisclaimerNote(),
    ...detectMissingInfo(deal),
    ...detectPartyConsistency(deal),
    ...detectPriceDepositConflicts(deal),
    ...detectDeadlineIssues(deal),
    ...coownershipRiskPrompts(deal),
  ];

  if (dealExecutionFlags.draftingKnowledgeV1) {
    issues.push(...(await buildClauseSuggestionsFromLibrary(deal.jurisdiction ?? "QC")));
  }

  return {
    issues,
    generatedAt: new Date().toISOString(),
    disclaimer:
      "Broker assistance only. Official OACIQ forms and brokerage instructions prevail. No automated legal conclusions.",
  };
}
