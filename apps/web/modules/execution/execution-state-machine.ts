import type { ExecutionPipelineState } from "./execution.types";

const ORDER: ExecutionPipelineState[] = [
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

/** Allowed edges (strict broker / guard enforcement at service layer). */
const ALLOWED: Record<ExecutionPipelineState, ExecutionPipelineState[]> = {
  draft: ["broker_review_required", "archived"],
  broker_review_required: ["draft", "broker_approved", "archived"],
  broker_approved: ["ready_for_execution", "broker_review_required", "archived"],
  ready_for_execution: ["execution_in_progress", "broker_approved", "archived"],
  execution_in_progress: ["awaiting_signature", "ready_for_execution", "archived"],
  awaiting_signature: ["partially_signed", "fully_signed", "execution_in_progress", "archived"],
  partially_signed: ["fully_signed", "awaiting_signature", "archived"],
  fully_signed: ["conditions_pending", "closing_ready", "archived"],
  conditions_pending: ["closing_ready", "fully_signed", "archived"],
  closing_ready: ["closed", "conditions_pending", "archived"],
  closed: ["archived"],
  archived: [],
};

export function normalizeState(s: ExecutionPipelineState | null | undefined): ExecutionPipelineState {
  return s ?? "draft";
}

export function canTransition(from: ExecutionPipelineState | null | undefined, to: ExecutionPipelineState): boolean {
  const f = normalizeState(from);
  return ALLOWED[f]?.includes(to) ?? false;
}

export function stateOrderIndex(s: ExecutionPipelineState): number {
  return ORDER.indexOf(s);
}
