import "server-only";

import type { ManagerAutopilotDecisionMode } from "@/lib/ai/permissions";
import { prisma } from "@/lib/db";

type ExecuteBody = {
  actionKey: string;
  targetEntityType: string;
  targetEntityId: string;
  payload?: Record<string, unknown>;
};

/** Records a guarded manager action for audit — safe fallback when fuller autonomy wiring is absent. */
export async function executeSafeManagerAction(opts: {
  userId: string;
  decisionMode: ManagerAutopilotDecisionMode | string;
  body: ExecuteBody;
  allowManualSafe?: boolean;
}): Promise<{ ok: boolean; error?: string; result?: { logId: string } }> {
  try {
    const row = await prisma.managerAiActionLog.create({
      data: {
        userId: opts.userId,
        actionKey: opts.body.actionKey,
        targetEntityType: opts.body.targetEntityType,
        targetEntityId: opts.body.targetEntityId,
        status: "executed",
        payload: {
          ...(opts.body.payload ?? {}),
          decisionMode: opts.decisionMode,
          manualSafeRequested: opts.allowManualSafe === true,
        },
      },
    });
    return { ok: true, result: { logId: row.id } };
  } catch {
    return { ok: false, error: "execute_failed" };
  }
}
