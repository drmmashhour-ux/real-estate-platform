import { executeSafeManagerAction } from "../actions/safe-execute";
import type { ExecutionContext } from "./execution-context";
import type { ExecutionResult } from "./execution-result";

export async function executeManagerActions(
  ctx: ExecutionContext,
  items: { actionKey: string; targetEntityType: string; targetEntityId: string; payload?: Record<string, unknown> }[]
): Promise<ExecutionResult[]> {
  const out: ExecutionResult[] = [];
  for (const it of items) {
    const r = await executeSafeManagerAction({
      userId: ctx.userId,
      decisionMode: ctx.decisionMode,
      body: {
        actionKey: it.actionKey,
        targetEntityType: it.targetEntityType,
        targetEntityId: it.targetEntityId,
        payload: it.payload,
      },
    });
    out.push({
      actionKey: it.actionKey,
      ok: r.ok,
      error: r.error,
      data: r.result,
    });
  }
  return out;
}
