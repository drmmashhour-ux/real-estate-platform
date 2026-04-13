/**
 * Hub-scoped AI layer — types shared across buyer, seller, BNHUB, broker, mortgage, investor, admin.
 */

export type AiHub = "buyer" | "seller" | "bnhub" | "rent" | "broker" | "mortgage" | "investor" | "admin";

/** Maps to product intents (prompt shaping + audit). */
export type AiIntent = "suggestion" | "summary" | "draft" | "explain" | "analyze" | "risk";

export type AiMessages = { system: string; user: string };

export type RunAiTaskParams = {
  hub: AiHub;
  feature: string;
  intent: AiIntent;
  /** Sanitized client context (listing ids, titles, numbers — never raw secrets). */
  context: Record<string, unknown>;
  userId: string;
  role: string;
  /** When true, row is tagged for legal AI monitoring (`ai_interaction_logs.legal_context`). */
  legalContext?: boolean;
};

export type RunAiTaskResult = {
  text: string;
  source: "openai" | "rules";
  model?: string | null;
  logId?: string;
};
