import type { AutonomousTaskOutput } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.types";

export type TaskPriority = AutonomousTaskOutput["priority"];

/** Semantic reason for priority (maps to critical → low). */
export type TaskPriorityReason =
  | "contradiction"
  | "escalation"
  | "unresolved_graph_blocker"
  | "mandatory_disclosure"
  | "missing_mandatory_fields"
  | "graph_blockers_present"
  | "route_back_required"
  | "signature_blocked"
  | "follow_up_details"
  | "routing_suggestion"
  | "signature_ready_pending_review"
  | "reviewer_comment_draft"
  | "case_summary";

/**
 * Deterministic priority mapping — calm, reviewer-first ordering.
 */
export function resolveTaskPriority(reason: TaskPriorityReason): TaskPriority {
  switch (reason) {
    case "contradiction":
    case "escalation":
    case "unresolved_graph_blocker":
      return "critical";
    case "mandatory_disclosure":
    case "missing_mandatory_fields":
    case "graph_blockers_present":
    case "route_back_required":
    case "signature_blocked":
      return "high";
    case "follow_up_details":
    case "routing_suggestion":
    case "signature_ready_pending_review":
    case "reviewer_comment_draft":
      return "medium";
    case "case_summary":
      return "low";
    default:
      return "medium";
  }
}
