import type { LecipmExecutionPipelineState as PrismaState } from "@prisma/client";

/** Platform coordination states — not OACIQ legal status. */
export type ExecutionPipelineState = PrismaState;

export const EXECUTION_PIPELINE_STATES: ExecutionPipelineState[] = [
  "draft",
  "broker_review_required",
  "broker_approved",
  "ready_for_execution",
  "execution_in_progress",
  "awaiting_signature",
  "partially_signed",
  "fully_signed",
  "conditions_pending",
  "closing_ready",
  "closed",
  "archived",
];

export type ExecutionTransitionReason =
  | "broker_submitted_for_review"
  | "broker_approved_execution"
  | "execution_started"
  | "signature_session_created"
  | "signature_progress"
  | "signature_completed"
  | "conditions_updated"
  | "closing_ready"
  | "closing_confirmed"
  | "closed"
  | "archived"
  | "system";
