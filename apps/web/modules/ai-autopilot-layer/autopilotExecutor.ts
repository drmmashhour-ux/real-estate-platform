/**
 * Executes approved (or auto-eligible prep) actions — state transitions only unless wired to services.
 */

import { prisma } from "@/lib/db";
import type { AutopilotLayerMode } from "./types";
import { guardActionKey, guardExecutionContext } from "./autopilotGuards";
import { AUTO_PREPARE_ACTION_KEYS, isForbiddenActionKey } from "./autopilotPolicy";
import { logAutopilotEvent } from "./autopilotAuditLogger";
import type { AutopilotPlanContext } from "./types";

export type ExecuteResult =
  | { ok: true; status: "EXECUTED" }
  | { ok: false; error: string; status: "BLOCKED" | "REJECTED" };

export async function executeAutopilotAction(
  actionId: string,
  ctx: AutopilotPlanContext,
  mode: AutopilotLayerMode
): Promise<ExecuteResult> {
  const row = await prisma.aiAutopilotLayerAction.findUnique({ where: { id: actionId } });
  if (!row) return { ok: false, error: "Action not found", status: "REJECTED" };

  if (row.status === "EXECUTED") return { ok: true, status: "EXECUTED" };
  if (row.status === "REJECTED" || row.status === "BLOCKED") {
    return { ok: false, error: "Action is terminal", status: row.status as "BLOCKED" | "REJECTED" };
  }

  if (isForbiddenActionKey(row.actionKey)) {
    await prisma.aiAutopilotLayerAction.update({
      where: { id: actionId },
      data: { status: "BLOCKED", blockReason: "Forbidden action" },
    });
    await logAutopilotEvent({
      userId: ctx.userId,
      actionId,
      eventKey: "autopilot_action_blocked",
      payload: { reason: "forbidden" },
    });
    return { ok: false, error: "Forbidden action", status: "BLOCKED" };
  }

  const keyGuard = guardActionKey(row.actionKey, mode);
  if (!keyGuard.ok) {
    await prisma.aiAutopilotLayerAction.update({
      where: { id: actionId },
      data: { status: "BLOCKED", blockReason: keyGuard.reason },
    });
    await logAutopilotEvent({
      userId: ctx.userId,
      actionId,
      eventKey: "autopilot_guard_failed",
      payload: { reason: keyGuard.reason },
    });
    return { ok: false, error: keyGuard.reason, status: "BLOCKED" };
  }

  const execGuard = guardExecutionContext(row.actionKey, mode, ctx);
  if (!execGuard.ok) {
    await prisma.aiAutopilotLayerAction.update({
      where: { id: actionId },
      data: { status: "BLOCKED", blockReason: execGuard.reason },
    });
    await logAutopilotEvent({
      userId: ctx.userId,
      actionId,
      eventKey: "autopilot_guard_failed",
      payload: { reason: execGuard.reason },
    });
    return { ok: false, error: execGuard.reason, status: "BLOCKED" };
  }

  const needsApproval = row.requiresApproval;
  const autoPrep = AUTO_PREPARE_ACTION_KEYS.has(row.actionKey) && (mode === "SAFE_AUTOPILOT" || mode === "FULL_AUTOPILOT_APPROVAL");

  if (needsApproval && !row.approvedAt && !autoPrep) {
    return { ok: false, error: "Approval required", status: "BLOCKED" };
  }

  await prisma.aiAutopilotLayerAction.update({
    where: { id: actionId },
    data: { status: "EXECUTED", executedAt: new Date() },
  });

  await logAutopilotEvent({
    userId: ctx.userId,
    actionId,
    eventKey: "autopilot_action_executed",
    payload: { actionKey: row.actionKey, mode },
  });

  return { ok: true, status: "EXECUTED" };
}
