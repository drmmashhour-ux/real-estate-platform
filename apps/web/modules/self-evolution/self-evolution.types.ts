import type { EvolutionPolicyScopeType, EvolutionProposalCategory, EvolutionAuthorKind, EvolutionRiskLevel, EvolutionProposalStatus, EvolutionEventDecision } from "@prisma/client";

export type { EvolutionProposalCategory, EvolutionRiskLevel, EvolutionProposalStatus, EvolutionAuthorKind, EvolutionEventDecision };

export type EvolutionCandidate = {
  category: EvolutionProposalCategory;
  targetScopeType: "GLOBAL" | "MARKET" | "DOMAIN" | "BROKERAGE" | "SEGMENT";
  targetScopeKey: string;
  currentVersionKey: string;
  proposedVersionKey: string;
  proposalJson: Record<string, unknown>;
  rationale: string[];
  expectedImpact: Record<string, unknown>;
  riskLevel: EvolutionRiskLevel;
};

export type EvolutionEvidence = {
  source: string;
  value: string | number | null;
  trace: string;
};

export type EvolutionRiskAssessment = {
  riskLevel: EvolutionRiskLevel;
  rationale: string[];
  blocked: boolean;
  blockedReasons: string[];
  /** CRITICAL = hard block */
  cap?: "none" | "soft" | "block";
};

export type EvolutionSandboxResult = {
  improvementEstimate: number | null;
  degradationRisk: number | null;
  affectedContexts: string[];
  confidence: number;
  resultJson: Record<string, unknown>;
  recommendation: "reject" | "review" | "promote_candidate";
  rationale: string[];
};

export type EvolutionPromotionDecision = {
  eligible: boolean;
  canAutoPromote: boolean;
  requireHuman: boolean;
  reason: string[];
  policy: import("./evolution-policy-defaults").PolicySnapshot | null;
};

export type EvolutionRollbackDecision = {
  shouldRollback: boolean;
  reason: string;
  currentVersionToRestore: string;
};

export type MetaLearningInsight = {
  mostEffective: { proposalId: string; category: string; versionKey: string; note: string }[];
  failed: { proposalId: string; category: string; note: string }[];
  rollbackProne: { category: string; count: number; note: string }[];
  strongestDomains: { domain: string; score: number; note: string }[];
  confidence: { summary: string; score: number };
  disclaimer: string;
  policySummary: { allowedAuto: string[]; needApproval: string[]; blocked: string[]; maxAutoRisk: string | null };
  evolutionPolicyScope?: { scopeType: EvolutionPolicyScopeType; scopeKey: string };
};
