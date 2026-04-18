/**
 * Draft-only messaging assist for CRM leads — no send pipeline; human copies/sends externally.
 */

export type AiMessagingAssistTone = "friendly" | "professional" | "short";

/** Persisted / embedded shape when stored under `Lead.aiExplanation.aiMessagingAssist` (optional; additive merge). */
export type AiMessagingAssistDraft = {
  version: "v1";
  suggestedReply: string;
  tone: AiMessagingAssistTone;
  rationale: string;
  generatedAt: string;
  /** Internal operator workflow only — never triggers send. */
  reviewState?: "needs_review" | "reviewed" | "done";
  reviewUpdatedAt?: string;
};

export type AiMessagingAssistInput = {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  listingId?: string | null;
  listingCode?: string | null;
  aiScore?: number | null;
  aiPriority?: string | null;
  aiTags?: unknown;
  createdAt: Date;
  /** Optional CRM closing context (Broker Closing V1) — draft tone only; never auto-send. */
  closingStage?: string | null;
  /** e.g. first_contact | follow_up | meeting_push — advisory template hint. */
  followUpDraftHint?: string | null;
};

export type AiMessagingAssistResult = {
  leadId: string;
  suggestedReply: string;
  tone: AiMessagingAssistTone;
  rationale: string;
  confidence: number;
  createdAt: string;
};
