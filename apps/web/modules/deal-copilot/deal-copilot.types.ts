export type CopilotOutputType =
  | "next_best_action"
  | "missing_document_warning"
  | "missing_field_warning"
  | "deadline_warning"
  | "clause_suggestion"
  | "inconsistency_warning"
  | "annex_recommendation"
  | "review_required"
  | "signature_preparation_prompt";

export type DealCopilotCard = {
  type: CopilotOutputType;
  title: string;
  summary: string;
  confidence: number;
  severity: "info" | "warning" | "critical";
  reasons: string[];
  recommendedAction: string;
  linkedDocuments?: string[];
  linkedFields?: string[];
};
