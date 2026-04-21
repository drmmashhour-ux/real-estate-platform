import type {
  AutonomousActionCandidate,
  AutonomousExecutionResult,
  AutonomyActionType,
} from "@/modules/autonomy/autonomy.types";
import { executeDraftGenerationAdapter } from "@/modules/autonomy/execution-adapters/draft-generation.adapter";
import { executeInternalPriorityAdapter } from "@/modules/autonomy/execution-adapters/internal-priority.adapter";
import { executeLeadRoutingAdapter } from "@/modules/autonomy/execution-adapters/lead-routing.adapter";
import { executeRankingAdapter } from "@/modules/autonomy/execution-adapters/ranking.adapter";
import { executeTaggingAdapter } from "@/modules/autonomy/execution-adapters/tagging.adapter";
import { executeTaskCreationAdapter } from "@/modules/autonomy/execution-adapters/task-creation.adapter";

export async function dispatchSafeExecution(
  candidate: AutonomousActionCandidate
): Promise<AutonomousExecutionResult> {
  const payload = candidate.payload;
  const t: AutonomyActionType = candidate.actionType;
  try {
    switch (t) {
      case "PRIORITIZE_DEAL":
        return executeInternalPriorityAdapter(candidate, payload);
      case "ROUTE_LEAD":
        return executeLeadRoutingAdapter(candidate, payload);
      case "CREATE_FOLLOWUP_TASK":
      case "ASSIGN_TASK":
        return executeTaskCreationAdapter(candidate, payload);
      case "TAG_LEAD":
      case "TAG_DEAL":
        return executeTaggingAdapter(candidate, payload);
      case "RANK_LISTINGS":
      case "APPLY_INTERNAL_RANKING_WEIGHT":
        return executeRankingAdapter(candidate, payload);
      case "GENERATE_MESSAGE_DRAFT":
      case "GENERATE_VISIT_PROPOSAL_DRAFT":
      case "GENERATE_NEGOTIATION_BRIEF":
      case "GENERATE_LISTING_OPTIMIZATION_DRAFT":
        return executeDraftGenerationAdapter(candidate, payload);
      case "UPDATE_INTERNAL_STATUS_SUGGESTION":
        return {
          ok: true,
          adapter: "status-suggestion",
          message: "Internal status suggestion recorded (no workflow mutation).",
          reversible: true,
          details: { payload },
        };
      case "ESCALATE_TO_HUMAN":
        return {
          ok: true,
          adapter: "escalation",
          message: "Escalation flag recorded for human review queue.",
          reversible: true,
          details: { payload },
        };
      default:
        return {
          ok: false,
          adapter: "none",
          message: "No safe adapter for action type — skipped.",
          reversible: true,
        };
    }
  } catch {
    return {
      ok: false,
      adapter: "error",
      message: "Adapter failure — skipped without throwing.",
      reversible: true,
    };
  }
}
