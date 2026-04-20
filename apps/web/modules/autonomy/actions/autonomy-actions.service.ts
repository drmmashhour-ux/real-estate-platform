import type { ProposedAction } from "../types/autonomy.types";

import { isAutonomyOsActionsEnabled } from "../lib/autonomy-layer-gate";
import { logAutonomy } from "../lib/autonomy-log";

/** Internal-safe execution stubs — never sends guest-facing messages (marketing stays draft-only upstream). */
export async function executeAutonomyAction(
  action: ProposedAction,
): Promise<{ success: boolean; actionId: string; executedAt: string }> {
  logAutonomy("[autonomy:action:execute:start]", {
    actionId: action.id,
    domain: action.domain,
    type: action.type,
  });

  if (!isAutonomyOsActionsEnabled()) {
    logAutonomy("[autonomy:action:execute:done]", { actionId: action.id, success: false, reason: "feature_gate" });
    return {
      success: false,
      actionId: action.id,
      executedAt: new Date().toISOString(),
    };
  }

  if (action.status !== "APPROVED" && action.status !== "DRAFT") {
    return {
      success: false,
      actionId: action.id,
      executedAt: new Date().toISOString(),
    };
  }

  if (action.domain === "MARKETING") {
    logAutonomy("[autonomy:action:execute:skipped]", {
      actionId: action.id,
      reason: "marketing_draft_only_no_guest_send",
    });
  }

  logAutonomy("[autonomy:action:execute:done]", { actionId: action.id });

  return {
    success: true,
    actionId: action.id,
    executedAt: new Date().toISOString(),
  };
}
