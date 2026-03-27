import { LecipmAiOperatorActionStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertSafeToExecute } from "@/src/modules/ai-operator/policies/safety";
import { runActionHandler } from "@/src/modules/ai-operator/application/actionHandlers";

export type ExecuteActionResult =
  | { ok: true; resultLog: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Execute only when `approved`. `suggested`/`pending` must wait for human decision.
 */
export async function executeAction(actionId: string, userId: string): Promise<ExecuteActionResult> {
  const row = await prisma.lecipmAiOperatorAction.findFirst({
    where: { id: actionId, userId },
  });

  if (!row) {
    return { ok: false, error: "Action not found" };
  }

  if (row.status === LecipmAiOperatorActionStatus.executed) {
    return { ok: false, error: "Already executed" };
  }

  if (row.status === LecipmAiOperatorActionStatus.rejected || row.status === LecipmAiOperatorActionStatus.failed) {
    return { ok: false, error: "Action is closed" };
  }

  if (row.status === LecipmAiOperatorActionStatus.suggested || row.status === LecipmAiOperatorActionStatus.pending) {
    return { ok: false, error: "Approval required before execution" };
  }

  if (row.status !== LecipmAiOperatorActionStatus.approved) {
    return { ok: false, error: "Invalid status for execution" };
  }

  const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<string, unknown>;
  const edited =
    row.editedPayload && typeof row.editedPayload === "object" ? (row.editedPayload as Record<string, unknown>) : null;

  assertSafeToExecute(row.type as never, true);

  const handler = runActionHandler(row.type as never, payload, edited);
  const resultLog: Record<string, unknown> = {
    handlerOk: handler.ok,
    handlerMessage: handler.message,
    handlerDetails: handler.details ?? null,
    executedAt: new Date().toISOString(),
  };

  if (!handler.ok) {
    await prisma.lecipmAiOperatorAction.update({
      where: { id: actionId },
      data: {
        status: LecipmAiOperatorActionStatus.failed,
        resultLog: resultLog as Prisma.InputJsonValue,
      },
    });
    return { ok: false, error: handler.message };
  }

  await prisma.lecipmAiOperatorAction.update({
    where: { id: actionId },
    data: {
      status: LecipmAiOperatorActionStatus.executed,
      resultLog: resultLog as Prisma.InputJsonValue,
    },
  });

  return { ok: true, resultLog };
}
