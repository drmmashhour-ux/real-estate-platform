/**
 * Approve / reject BNHub autopilot actions — pending-only transitions.
 */

import type { BNHubAutopilotActionStatus } from "./bnhub-autopilot.types";
import {
  getBnhubAutopilotAction,
  updateBnhubAutopilotAction,
} from "./bnhub-autopilot-store.service";
import { recordBnhubAutopilotApproved, recordBnhubAutopilotRejected } from "./bnhub-autopilot-monitoring.service";

export function approveBnHubAutopilotAction(actionId: string): {
  ok: boolean;
  error?: string;
  previous?: BNHubAutopilotActionStatus;
} {
  const a = getBnhubAutopilotAction(actionId);
  if (!a) return { ok: false, error: "not_found" };
  if (a.status !== "pending") {
    return { ok: false, error: "not_pending", previous: a.status };
  }
  updateBnhubAutopilotAction(actionId, { status: "approved" });
  try {
    recordBnhubAutopilotApproved(actionId);
  } catch {
    /* */
  }
  return { ok: true, previous: "pending" };
}

export function rejectBnHubAutopilotAction(actionId: string): {
  ok: boolean;
  error?: string;
  previous?: BNHubAutopilotActionStatus;
} {
  const a = getBnhubAutopilotAction(actionId);
  if (!a) return { ok: false, error: "not_found" };
  if (a.status !== "pending") {
    return { ok: false, error: "not_pending", previous: a.status };
  }
  updateBnhubAutopilotAction(actionId, { status: "rejected" });
  try {
    recordBnhubAutopilotRejected(actionId);
  } catch {
    /* */
  }
  return { ok: true, previous: "pending" };
}
