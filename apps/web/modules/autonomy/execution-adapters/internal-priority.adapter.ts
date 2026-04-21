import type { AutonomousActionCandidate } from "@/modules/autonomy/autonomy.types";
import type { AutonomousExecutionResult } from "@/modules/autonomy/autonomy.types";

/** Internal priority bookkeeping — no external side effects. */
export async function executeInternalPriorityAdapter(
  _candidate: AutonomousActionCandidate,
  payload: Record<string, unknown>
): Promise<AutonomousExecutionResult> {
  return {
    ok: true,
    adapter: "internal-priority",
    message: "Recorded internal priority suggestion (dry-run; connect CRM priority field when wired).",
    reversible: true,
    details: { payloadKeys: Object.keys(payload) },
  };
}
