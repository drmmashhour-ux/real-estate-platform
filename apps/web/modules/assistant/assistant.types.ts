/** Broker guidance layer — suggestions only; never auto-sends messages. */

export type AssistantSuggestionType = "ACTION" | "ALERT" | "REMINDER";

export type AssistantPriority = "HIGH" | "MEDIUM" | "LOW";

export type AssistantSuggestion = {
  type: AssistantSuggestionType;
  message: string;
  priority: AssistantPriority;
};

export type AssistantDealContext = {
  id: string;
  status: string;
  updatedAt: Date;
  daysSinceTouch: number;
  priceCents: number;
};

export type AssistantLeadContext = {
  id: string;
  status: string;
  pipelineStatus: string;
  score: number;
  updatedAt: Date;
  daysSinceTouch: number;
  highIntent: boolean;
};

export type AssistantEngineInput = {
  deal: AssistantDealContext | null;
  lead: AssistantLeadContext | null;
  /** Hours since last meaningful broker-side touch (deal/lead aggregate heuristic). */
  hoursSinceLastBrokerAction: number | null;
  /** Count of broker-attributed leads with no update in 7+ days (signal only). */
  staleLeadCount?: number;
};
