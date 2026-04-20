/**
 * Phase 6.5 — deterministic explainability types (no logic).
 * Preview / dry-run reasoning chain only.
 */

export type ExplanationLevel = "simple" | "detailed" | "debug";

export type ExplanationNode = {
  id: string;
  type: "signal" | "opportunity" | "policy" | "action";
  title: string;
  description: string;
  severity?: string;
  references?: string[];
};

export type ExplanationEdge = {
  from: string;
  to: string;
  reason: string;
};

export type ExplanationGraph = {
  nodes: ExplanationNode[];
  edges: ExplanationEdge[];
};

export type ListingExplanation = {
  listingId: string;
  summary: string;
  keyFindings: string[];
  graph: ExplanationGraph;
  recommendations: string[];
  level: ExplanationLevel;
};

/** User-facing minimal copy — no graph, no policy internals. */
export type UserSafeListingReasoning = {
  summary: string;
};
