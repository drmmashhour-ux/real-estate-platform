/**
 * In-memory approval store — no DB. Process lifetime only (serverless: best-effort persistence per instance).
 */

import type { AiAutopilotActionStatus } from "./ai-autopilot.types";

const statusByActionId = new Map<string, AiAutopilotActionStatus>();

export function getAutopilotActionStatus(actionId: string): AiAutopilotActionStatus {
  return statusByActionId.get(actionId) ?? "pending";
}

export function setAutopilotActionStatus(actionId: string, status: AiAutopilotActionStatus): void {
  statusByActionId.set(actionId, status);
}

export function approveAction(actionId: string): { ok: boolean; previous: AiAutopilotActionStatus } {
  const previous = getAutopilotActionStatus(actionId);
  setAutopilotActionStatus(actionId, "approved");
  return { ok: true, previous };
}

export function rejectAction(actionId: string): { ok: boolean; previous: AiAutopilotActionStatus } {
  const previous = getAutopilotActionStatus(actionId);
  setAutopilotActionStatus(actionId, "rejected");
  return { ok: true, previous };
}

/** Test / admin only — clears in-memory map. */
export function resetAutopilotApprovalsForTests(): void {
  statusByActionId.clear();
}
