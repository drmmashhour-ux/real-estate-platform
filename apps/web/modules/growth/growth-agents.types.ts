/**
 * Multi-agent growth coordination — proposals only; no execution.
 */

export type GrowthAgentId =
  | "ads_agent"
  | "cro_agent"
  | "leads_agent"
  | "messaging_agent"
  | "content_agent"
  | "governance_agent"
  | "fusion_agent";

export type GrowthAgentProposal = {
  id: string;
  agentId: GrowthAgentId;
  title: string;
  description: string;
  domain: "ads" | "cro" | "leads" | "messaging" | "content" | "governance" | "fusion";
  impact: "low" | "medium" | "high";
  confidence: number;
  priorityScore?: number;
  rationale: string;
  blockers?: string[];
  requiresHumanReview?: boolean;
  createdAt: string;
};

export type GrowthAgentConflict = {
  id: string;
  proposalIds: string[];
  reason: string;
  severity: "low" | "medium" | "high";
};

export type GrowthAgentAlignment = {
  id: string;
  proposalIds: string[];
  theme: string;
  confidence: number;
};

export type GrowthAgentCoordinationResult = {
  proposals: GrowthAgentProposal[];
  conflicts: GrowthAgentConflict[];
  alignments: GrowthAgentAlignment[];
  topPriorities: GrowthAgentProposal[];
  notes: string[];
  createdAt: string;
};

/** Shared read-only snapshot for agent builders (coordinator fills). */
export type AgentCoordinationContext = {
  adsInsights: { problems: string[]; opportunities: string[]; health: "STRONG" | "OK" | "WEAK" } | null;
  leadsToday: number;
  totalEarlyLeads: number;
  governance: import("./growth-governance.types").GrowthGovernanceDecision | null;
  fusionActions: import("./growth-fusion.types").GrowthFusionAction[];
  fusionSummary: import("./growth-fusion.types").GrowthFusionSummary | null;
  dueNowCount: number;
  hotLeadCount: number;
  crmLeadTotal: number;
  messagingAssistEnabled: boolean;
  contentAssistEnabled: boolean;
};
