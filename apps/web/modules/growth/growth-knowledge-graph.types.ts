/**
 * Growth Knowledge Graph — advisory relationship map; no persistence; no execution.
 */

export type GrowthKnowledgeNodeType =
  | "campaign"
  | "blocker"
  | "winning_pattern"
  | "lesson"
  | "operator_decision"
  | "recommendation"
  | "outcome"
  | "priority"
  | "risk";

export type GrowthKnowledgeEdgeType =
  | "causes"
  | "relates_to"
  | "supports"
  | "conflicts_with"
  | "resulted_in"
  | "reinforces"
  | "blocks"
  | "preferred_by_operator";

export type GrowthKnowledgeNodeSource =
  | "memory"
  | "governance"
  | "strategy"
  | "executive"
  | "simulation"
  | "autopilot"
  | "manual";

export type GrowthKnowledgeNode = {
  id: string;
  type: GrowthKnowledgeNodeType;
  title: string;
  detail?: string;
  source: GrowthKnowledgeNodeSource;
  confidence?: number;
  tags?: string[];
  createdAt: string;
};

export type GrowthKnowledgeEdge = {
  id: string;
  fromId: string;
  toId: string;
  type: GrowthKnowledgeEdgeType;
  confidence?: number;
  rationale: string;
  createdAt: string;
};

export type GrowthKnowledgeGraph = {
  nodes: GrowthKnowledgeNode[];
  edges: GrowthKnowledgeEdge[];
  summary: {
    nodeCount: number;
    edgeCount: number;
    dominantThemes: string[];
    recurringBlockers: string[];
    repeatedWinners: string[];
  };
  createdAt: string;
};

/** Read-only assembly input for nodes/edges — no mutations by builders. */
export type GrowthKnowledgeGraphBuildInput = {
  memory: import("./growth-memory.types").GrowthMemorySummary | null;
  executive: import("./growth-executive.types").GrowthExecutiveSummary | null;
  governance: import("./growth-governance.types").GrowthGovernanceDecision | null;
  strategyBundle: import("./growth-strategy.types").GrowthStrategyBundle | null;
  simulationBundle: import("./growth-simulation.types").GrowthSimulationBundle | null;
  autopilotActionTitles: string[];
  topCampaignLabel?: string;
  adsBand: "WEAK" | "OK" | "STRONG";
  missingDataWarnings: string[];
};
