export type AiAssistSuggestionType =
  | "lead_followup"
  | "broker_message"
  | "routing_decision"
  | "pricing_adjustment";

export type AiAssistSuggestion = {
  id: string;
  type: AiAssistSuggestionType;
  title: string;
  suggestion: string;
  /** 0–1 from deterministic rules (not LLM). */
  confidence: number;
  /** When true, UI must not imply one-click execution without human approval. */
  requiresApproval: boolean;
};

export type AiExecutionContext = {
  /** Focus lead score 0–100 when known. */
  topLeadScore?: number | null;
  leadPipelineStatus?: string | null;
  /** Hot/warm/cold when known. */
  leadAiTier?: string | null;
  topBrokerId?: string | null;
  topBrokerLabel?: string | null;
  /** When governance/policy blocks autonomous execution paths. */
  governanceFreeze?: boolean;
};
