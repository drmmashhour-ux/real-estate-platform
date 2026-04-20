/**
 * Deterministic preview explainability — types only (no LLM).
 */

export type ListingPreviewExplainabilitySummary = string;

export type ListingPreviewKeyFinding = {
  id: string;
  label: string;
  detail: string;
};

export type ListingPreviewRecommendation = {
  id: string;
  title: string;
  detail: string;
};

export type ListingPreviewExplanationNodeKind =
  | "metrics"
  | "signal"
  | "opportunity"
  | "policy"
  | "action";

export type ListingPreviewExplanationNode = {
  id: string;
  kind: ListingPreviewExplanationNodeKind;
  label: string;
  detail: string;
};

export type ListingPreviewExplanationEdge = {
  fromId: string;
  toId: string;
  reason: string;
};

export type ListingPreviewExplanationGraph = {
  nodes: ListingPreviewExplanationNode[];
  edges: ListingPreviewExplanationEdge[];
};

export type ListingPreviewExplanation = {
  summary: ListingPreviewExplainabilitySummary;
  keyFindings: ListingPreviewKeyFinding[];
  recommendations: ListingPreviewRecommendation[];
  graph: ListingPreviewExplanationGraph;
};
