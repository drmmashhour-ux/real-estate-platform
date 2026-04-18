export type ClauseSuggestionType =
  | "annex_recommendation"
  | "workflow_reminder"
  | "deposit_timing"
  | "financing_flow"
  | "seller_disclosure"
  | "brokerage_remuneration"
  | "unrepresented_buyer_notice";

export type SourceRef = {
  sourceName: string;
  formCode?: string;
  pageNumber?: number | null;
  sectionLabel?: string | null;
};

export type ClauseEngineSuggestion = {
  suggestionType: ClauseSuggestionType;
  title: string;
  summary: string;
  sourceReferences: SourceRef[];
  confidence: number;
  brokerReviewRequired: true;
};
