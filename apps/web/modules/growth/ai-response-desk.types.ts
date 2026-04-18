/**
 * Internal response desk — draft review queue only; no outbound messaging.
 */

export type AiResponseDeskStatus =
  | "draft_ready"
  | "needs_review"
  | "reviewed"
  | "followup_recommended"
  | "done";

/** Persisted under `Lead.aiExplanation.aiMessagingAssist.reviewState` (subset). */
export type AiMessagingAssistReviewState = "needs_review" | "reviewed" | "done";

export type AiResponseDeskItem = {
  leadId: string;
  leadName: string;
  leadEmail: string;
  draftStatus: AiResponseDeskStatus;
  aiPriority?: "low" | "medium" | "high";
  followUpPriority?: "low" | "medium" | "high";
  suggestedReply?: string;
  rationale?: string;
  updatedAt?: string;
  /** Sort tier for deterministic ordering (higher = respond first). */
  sortTier: number;
};

export type AiResponseDeskLeadRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  aiPriority: string | null;
  aiTags: unknown;
  aiExplanation: unknown;
  createdAt: Date;
};
