/**
 * Internal follow-up workflow — queue + states only; no outbound messaging.
 */

export type AiFollowUpPriority = "low" | "medium" | "high";

export type AiFollowUpStatus = "new" | "queued" | "due_now" | "waiting" | "done";

/** Persisted under `Lead.aiExplanation.aiFollowUp` (additive JSON merge). */
export type AiFollowUpState = {
  version: "v1";
  status: AiFollowUpStatus;
  nextActionAt?: string;
  followUpPriority?: AiFollowUpPriority;
  reminderReason?: string;
  queueScore?: number;
  updatedAt: string;
};

export type AiFollowUpDecision = {
  leadId: string;
  status: AiFollowUpStatus;
  followUpPriority: AiFollowUpPriority;
  queueScore: number;
  nextActionAt?: string;
  reminderReason?: string;
  rationale: string;
  updatedAt: string;
};

export type AiFollowUpQueueItem = AiFollowUpDecision & {
  name: string;
  email: string;
  aiPriority: string | null;
};

export type AiFollowUpExecutionResult = {
  processed: number;
  written: number;
  dueNow: number;
  queued: number;
  waiting: number;
  done: number;
  failures: number;
};
