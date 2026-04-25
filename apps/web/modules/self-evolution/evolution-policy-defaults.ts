import type { EvolutionPolicyScopeType, EvolutionRiskLevel } from "@prisma/client";

/**
 * In-code snapshot (mirrors DB `self_evolution_policies` default row and fallbacks).
 * Never self-relaxes legal, compliance, financial, or autonomy rules in code.
 */
export type PolicySnapshot = {
  scopeType: EvolutionPolicyScopeType;
  scopeKey: string;
  /** EvolutionProposalCategory string values that may auto-promote (LOW risk + evidence only). */
  allowedSelfPromotionCategories: string[];
  /** Always require human before promote. */
  approvalRequiredCategories: string[];
  /** Not generatable and not auto-promotable (semantic tags, not all enum values). */
  blockedSemanticTags: string[];
  maxAutoPromoteRiskLevel: EvolutionRiskLevel | null;
  minSampleSize: number;
  minConfidence: number;
  maxDegradationVsBaseline: number;
};

const DEFAULT: PolicySnapshot = {
  scopeType: "GLOBAL",
  scopeKey: "global",
  allowedSelfPromotionCategories: ["ROUTING_WEIGHT", "RANKING_WEIGHT", "THRESHOLD"],
  approvalRequiredCategories: ["PLAYBOOK", "HANDOFF_RULE", "FEATURE_SUBSET", "FOLLOWUP_TIMING", "OTHER"],
  blockedSemanticTags: [
    "COMPLIANCE",
    "LEGAL",
    "FINANCIAL_APPROVAL",
    "AUTONOMY",
    "EXTERNAL_MESSAGING",
    "BROKER_MANDATORY",
    "REGULATORY",
  ],
  maxAutoPromoteRiskLevel: "LOW",
  minSampleSize: 30,
  minConfidence: 0.55,
  maxDegradationVsBaseline: 0.12,
};

export function getDefaultPolicySnapshot(): PolicySnapshot {
  return { ...DEFAULT };
}

export function parsePolicyFromDb(
  p: {
    allowedSelfPromotionCategoriesJson: unknown;
    approvalRequiredCategoriesJson: unknown;
    blockedCategoriesJson: unknown;
    maxAutoPromoteRiskLevel: EvolutionRiskLevel | null;
    minEvidenceThresholdJson: unknown;
    rollbackThresholdJson: unknown;
    scopeType: EvolutionPolicyScopeType;
    scopeKey: string;
  } | null
): PolicySnapshot {
  if (!p) {
    return getDefaultPolicySnapshot();
  }
  const minE = p.minEvidenceThresholdJson as { minSampleSize?: number; minConfidence?: number } | null;
  const rb = p.rollbackThresholdJson as { maxDegradationVsBaseline?: number } | null;
  return {
    scopeType: p.scopeType,
    scopeKey: p.scopeKey,
    allowedSelfPromotionCategories: (p.allowedSelfPromotionCategoriesJson as string[]) ?? DEFAULT.allowedSelfPromotionCategories,
    approvalRequiredCategories: (p.approvalRequiredCategoriesJson as string[]) ?? DEFAULT.approvalRequiredCategories,
    blockedSemanticTags: (p.blockedCategoriesJson as string[]) ?? DEFAULT.blockedSemanticTags,
    maxAutoPromoteRiskLevel: p.maxAutoPromoteRiskLevel ?? "LOW",
    minSampleSize: minE?.minSampleSize ?? DEFAULT.minSampleSize,
    minConfidence: minE?.minConfidence ?? DEFAULT.minConfidence,
    maxDegradationVsBaseline: rb?.maxDegradationVsBaseline ?? DEFAULT.maxDegradationVsBaseline,
  };
}
