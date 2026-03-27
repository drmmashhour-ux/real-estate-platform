import type { FileHealth } from "@/src/modules/legal-intelligence-graph/domain/legalGraph.enums";

export type GraphNodeInput = {
  entityType: string;
  entityId: string;
  nodeType: string;
  payload?: Record<string, unknown>;
};

export type GraphEdgeInput = {
  fromNodeId: string;
  toNodeId: string;
  edgeType: string;
  payload?: Record<string, unknown>;
};

export type LegalGraphSummary = {
  fileHealth: FileHealth;
  blockingIssues: string[];
  warnings: string[];
  missingDependencies: string[];
  unresolvedReviewIssues: string[];
  /** Count of open graph issues with critical severity (for escalation policy). */
  criticalOpenCount: number;
  signatureReadiness: { ready: boolean; reasons: string[] };
  nextActions: string[];
};
