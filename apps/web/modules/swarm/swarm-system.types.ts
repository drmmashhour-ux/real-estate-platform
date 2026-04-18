/**
 * Multi-agent swarm layer — advisory types only (no source-of-truth overrides).
 */

import type { AutonomousCompanyCycleResult } from "@/modules/autonomous-company/autonomous-company.types";
import type { FusionPrimarySurfaceResult } from "@/modules/fusion/fusion-system.types";

export type SwarmAgentId =
  | "ads"
  | "cro"
  | "brain"
  | "operator"
  | "platform_core"
  | "strategy"
  | "market_intel"
  | "content";

export type SwarmAgentRole =
  | "performance"
  | "conversion"
  | "intelligence"
  | "execution"
  | "orchestration"
  | "strategy"
  | "market"
  | "content";

export type SwarmProposalKind =
  | "scale"
  | "reduce"
  | "experiment"
  | "caution"
  | "execute"
  | "defer"
  | "block"
  | "content_draft"
  | "monitor"
  | "other";

/** Optional advisory overlay — only set on copies when Phase B influence applies. */
export type SwarmInfluenceOverlay = {
  tags: string[];
  /** Bounded display rank adjustment (additive to priority for sorting only). */
  rankAdjustment: number;
};

export type SwarmProposal = {
  id: string;
  agentId: SwarmAgentId;
  role: SwarmAgentRole;
  sourceSystems: string[];
  targetEntity?: { type: string; id?: string | null };
  recommendationType: SwarmProposalKind;
  confidence: number;
  priority: number;
  risk: number;
  evidenceQuality: number;
  blockers: string[];
  dependencies: string[];
  rationale: string;
  suggestedNextAction: string;
  freshnessAt: string;
  influenceOverlay?: SwarmInfluenceOverlay;
};

export type SwarmRisk = {
  id: string;
  agentId: SwarmAgentId;
  severity: "low" | "medium" | "high";
  summary: string;
};

export type SwarmAgentOutput = {
  agentId: SwarmAgentId;
  role: SwarmAgentRole;
  proposals: SwarmProposal[];
  risks: SwarmRisk[];
  warnings: string[];
  failureReason?: string;
};

export type SwarmAgentInput = {
  cycleId: string;
  generatedAt: string;
  environment: "development" | "staging" | "production";
  /** Read-only snapshots — never mutated by agents. */
  autonomousCompanyResult?: AutonomousCompanyCycleResult | null;
  fusionSurface?: FusionPrimarySurfaceResult | null;
};

export type SwarmConflict = {
  id: string;
  proposalIds: string[];
  agents: SwarmAgentId[];
  category: string;
  summary: string;
};

export type SwarmNegotiationStatus =
  | "proceed"
  | "proceed_with_caution"
  | "monitor_only"
  | "defer"
  | "blocked"
  | "require_human_review";

export type SwarmNegotiationResult = {
  proposalId: string;
  status: SwarmNegotiationStatus;
  notes: string[];
  dominantAgentId?: SwarmAgentId;
};

export type SwarmAggregateScores = {
  swarmConfidence: number;
  swarmPriority: number;
  swarmRisk: number;
  swarmReadiness: number;
  agreementScore: number;
  evidenceScore: number;
  executionSuitability: number;
};

export type SwarmDecisionBundleGrouped = {
  proceed: SwarmProposal[];
  caution: SwarmProposal[];
  monitor: SwarmProposal[];
  defer: SwarmProposal[];
  blocked: SwarmProposal[];
  human_review: SwarmProposal[];
};

export type SwarmDecisionBundle = {
  opportunities: SwarmProposal[];
  groupedBy: SwarmDecisionBundleGrouped;
  conflicts: SwarmConflict[];
  negotiationResults: SwarmNegotiationResult[];
  scores: SwarmAggregateScores;
  meta: {
    agentsRun: SwarmAgentId[];
    agreementScore: number;
    conflictCount: number;
    evidenceQuality: number;
    readinessSummary: string;
    primarySurface: "none" | "fusion" | "swarm";
    /** True only on presentation copies when Phase B overlay was applied. */
    influenceApplied: boolean;
  };
};

/** Phase B — controlled influence observability (advisory only). */
export type SwarmInfluenceReport = {
  applied: boolean;
  skippedReason?: string;
  qualityGatesOk: boolean;
  agreementBoostCount: number;
  conflictCautionCount: number;
  humanReviewEscalationCount: number;
  lowEvidenceMonitorCount: number;
  deferOrBlockedTagCount: number;
  itemsInfluencedCount: number;
  skippedInfluenceCount: number;
  reasonSummary: string;
  agentCoverageSummary: string;
  observationalWarnings: string[];
};

export type SwarmHealthSummary = {
  agentsRun: number;
  proposalCount: number;
  conflictCount: number;
  negotiationOutcomeCounts: Partial<Record<SwarmNegotiationStatus, number>>;
  insufficientEvidenceRate: number;
  blockedDeferRate: number;
  topDisagreementCategories: string[];
  perAgentFailureCount: Record<string, number>;
  subsystemCoverageSummary: string;
  observationalWarnings: string[];
};

export type SwarmSnapshot = {
  cycleId: string;
  generatedAt: string;
  /** Base swarm advisory bundle (negotiation + scores; never mutated in place). */
  bundle: SwarmDecisionBundle;
  /** When influence gates pass — presentation-ranked copy with optional `influenceOverlay`; null when off or skipped. */
  influencedBundle: SwarmDecisionBundle | null;
  influenceReport: SwarmInfluenceReport | null;
  health: SwarmHealthSummary;
};
