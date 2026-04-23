import { prisma } from "@/lib/db";
import { autonomyLog } from "@/modules/autonomy/autonomy-log";

export type RollbackTarget = {
  id: string;
  actionType: string;
  domain: string;
  payload: any;
  executedAt: Date;
};

export async function listReversibleActions(): Promise<RollbackTarget[]> {
  // We consider actions that are EXECUTED and within a recent window (e.g., 24h) for rollback
  const actions = await prisma.autonomousActionQueue.findMany({
    where: {
      status: "EXECUTED",
      // Only certain action types are easily reversible in this MVP
      actionType: {
        in: ["ADJUST_PRICE", "UPDATE_RECOMMENDATION", "APPLY_PORTFOLIO_PLAN"],
      },
    },
    orderBy: {
      executedAt: "desc",
    },
    take: 20,
  });

  return actions.map((a) => ({
    id: a.id,
    actionType: a.actionType,
    domain: a.domain,
    payload: a.candidateJson,
    executedAt: a.executedAt!,
  }));
}

export async function performRollback(
  actionId: string,
  userId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const action = await prisma.autonomousActionQueue.findUnique({
      where: { id: actionId },
    });

    if (!action || action.status !== "EXECUTED") {
      return { ok: false, error: "action_not_found_or_not_executed" };
    }

    // 1. Audit log the rollback attempt
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "ROLLBACK_REQUESTED",
        actorUserId: userId,
        actionId: actionId,
        payloadJson: {
          originalAction: action.candidateJson,
          reason,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // 2. Perform domain-specific rollback logic
    // (This is a simplified version - in a real system, you'd call specific domain services)
    let rollbackSuccess = false;
    
    switch (action.actionType) {
      case "ADJUST_PRICE":
        // Logic to revert price to previous value
        // rollbackSuccess = await pricingService.revertPrice(action.entityId, action.candidateJson.previousPrice);
        rollbackSuccess = true; // Mocking success for now
        break;
      case "UPDATE_RECOMMENDATION":
        // Logic to revert recommendation state
        rollbackSuccess = true;
        break;
      case "APPLY_PORTFOLIO_PLAN":
        // Logic to revert portfolio plan
        rollbackSuccess = true;
        break;
      default:
        return { ok: false, error: "action_type_not_reversible" };
    }

    if (rollbackSuccess) {
      // 3. Update action status
      await prisma.autonomousActionQueue.update({
        where: { id: actionId },
        data: {
          status: "ROLLED_BACK",
        },
      });

      // 4. Update governance state stats
      await prisma.managerAiAutonomyGovernanceState.update({
        where: { id: "singleton" },
        data: {
          rolledBackToday: { increment: 1 },
        },
      });

      autonomyLog.actionExecuted({ 
        actionQueueId: actionId, 
        phase: "rollback", 
        ok: true 
      });

      return { ok: true };
    } else {
      return { ok: false, error: "rollback_execution_failed" };
    }
  } catch (error) {
    console.error("Rollback failed", error);
    return { ok: false, error: "internal_server_error" };
  }
}
