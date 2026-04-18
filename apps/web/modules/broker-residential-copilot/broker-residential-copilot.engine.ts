import type { Deal } from "@prisma/client";
import { dealExecutionFlags } from "@/config/feature-flags";
import { brokerResidentialFlags } from "@/config/feature-flags";
import { runContractIntelligence } from "@/modules/contract-intelligence/contract-intelligence.engine";
import { suggestWorkflowPackage } from "@/modules/form-packages/workflow-matcher.service";
import { residentialChecklistPrompts } from "./residential-checklist-prompts.service";
import { residentialRiskPromptsForDeal } from "./residential-risk-prompts.service";

/**
 * Aggregates explainable prompts for the residential deal workspace (server-only).
 */
export async function runResidentialDealWorkspaceEngine(deal: Deal) {
  if (!brokerResidentialFlags.residentialCopilotV1 || !dealExecutionFlags.contractIntelligenceV1) {
    return {
      workflowHint: suggestWorkflowPackage(deal),
      checklist: residentialChecklistPrompts(deal),
      riskPrompts: residentialRiskPromptsForDeal(deal),
      intelligence: { issues: [], disclaimer: "Copilot disabled.", generatedAt: new Date().toISOString() },
    };
  }

  const [ci] = await Promise.all([runContractIntelligence(deal)]);

  return {
    workflowHint: suggestWorkflowPackage(deal),
    checklist: residentialChecklistPrompts(deal),
    riskPrompts: residentialRiskPromptsForDeal(deal),
    intelligence: ci,
  };
}
