export type NegotiationSuggestionPayload = {
  recommendedMove: string;
  rationale: string[];
  tradeoffs: string[];
  riskNotes: string[];
  sourceRefs?: string[];
  brokerApprovalRequired: true;
};

export type NegotiationEngineOutput = {
  suggestionType: string;
  title: string;
  summary: string;
  payload: NegotiationSuggestionPayload;
  confidence: number;
  impactEstimate: string;
  riskLevel: "low" | "medium" | "high";
};
