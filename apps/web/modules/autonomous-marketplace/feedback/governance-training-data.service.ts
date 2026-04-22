/**
 * Deterministic ML training row shapes — derived labels only; governance remains authoritative at runtime.
 */
import type { GovernanceFeedbackInput, GovernanceFeedbackResult } from "./governance-feedback.types";

export interface GovernanceTrainingRow {
  regionCode?: string;
  actionType?: string;
  entityType?: string;
  governanceDisposition: string;
  blocked: boolean;
  requiresHumanApproval: boolean;
  allowExecution: boolean;
  legalRiskScore: number;
  fraudRiskScore: number;
  combinedRiskScore: number;
  revenueImpactEstimate: number;
  outcomeLabel: string;
  falsePositive: boolean;
  falseNegative: boolean;
}

export function buildGovernanceTrainingRow(args: {
  input: GovernanceFeedbackInput;
  result: GovernanceFeedbackResult;
}): GovernanceTrainingRow {
  return {
    regionCode: args.input.regionCode,
    actionType: args.input.actionType,
    entityType: args.input.entityType,
    governanceDisposition: args.input.prediction.governanceDisposition,
    blocked: args.input.prediction.blocked,
    requiresHumanApproval: args.input.prediction.requiresHumanApproval,
    allowExecution: args.input.prediction.allowExecution,
    legalRiskScore: args.input.prediction.legalRiskScore,
    fraudRiskScore: args.input.prediction.fraudRiskScore,
    combinedRiskScore: args.input.prediction.combinedRiskScore,
    revenueImpactEstimate: args.input.prediction.revenueImpactEstimate ?? 0,
    outcomeLabel: args.result.label,
    falsePositive: args.result.falsePositive,
    falseNegative: args.result.falseNegative,
  };
}
