import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type RollbackResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Best-effort rollback — only when execution row marks `rollbackEligible` and not already rolled back. */
export async function rollbackAutopilotExecution(params: {
  executionId: string;
  actorUserId: string;
  reason: string;
}): Promise<RollbackResult> {
  const row = await prisma.lecipmFullAutopilotExecution.findUnique({
    where: { id: params.executionId },
  });
  if (!row) return { ok: false, reason: "not_found" };
  if (!row.rollbackEligible) {
    return { ok: false, reason: "not_reversible_under_current_policy" };
  }
  if (row.rolledBackAt) return { ok: false, reason: "already_rolled_back" };

  await prisma.lecipmFullAutopilotExecution.update({
    where: { id: params.executionId },
    data: {
      rolledBackAt: new Date(),
      rollbackReason: params.reason.slice(0, 8000),
      rollbackActorId: params.actorUserId,
    },
  });

  if (row.platformActionId) {
    await prisma.platformAutopilotDecision.create({
      data: {
        actionId: row.platformActionId,
        decisionType: "ROLLBACK_REQUESTED",
        actorUserId: params.actorUserId,
        actorType: "admin",
        notes: {
          executionId: params.executionId,
          reason: params.reason,
          note: "Orchestrator-level rollback marker — domain workers must reconcile side effects.",
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return { ok: true };
}
