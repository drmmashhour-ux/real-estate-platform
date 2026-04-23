/** Broker guidance layer — advisory; execution is explicit + logged when enabled. */

export type AssistantSuggestionType = "ACTION" | "ALERT" | "REMINDER";

export type AssistantPriority = "HIGH" | "MEDIUM" | "LOW";

export type AssistantExecutionStatus = "idle" | "pending" | "done" | "failed";

/** Executable recommendation kinds (extend as new flows ship). */
export type AssistantActionType =
  | "SEND_FOLLOWUP"
  | "SCHEDULE_VISIT"
  | "RESCHEDULE_VISIT"
  | "ESCALATE_TO_ADMIN"
  | "ASSIGN_BROKER"
  | "SEND_SIMILAR_LISTINGS"
  | "REQUEST_OFFER_UPDATE";

export type AssistantSuggestion = {
  /** Stable id for UI + execute API correlation (hash of content + context). */
  id: string;
  type: AssistantSuggestionType;
  message: string;
  priority: AssistantPriority;
  actionType?: AssistantActionType;
  actionPayload?: Record<string, unknown>;
  /** When false, execute API may run without second modal (still logged). */
  requiresConfirmation?: boolean;
  executionStatus?: AssistantExecutionStatus;
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
  /** Current route context — used for actionable payloads. */
  contextLeadId?: string | null;
  contextDealId?: string | null;
};
