import type { AutonomousActionCandidate, AutonomousExecutionResult } from "@/modules/autonomy/autonomy.types";

/** Internal task placeholder — safe to extend to TeamTask or broker tasks table. */
export async function executeTaskCreationAdapter(
  _candidate: AutonomousActionCandidate,
  payload: Record<string, unknown>
): Promise<AutonomousExecutionResult> {
  return {
    ok: true,
    adapter: "task-creation",
    message: "Follow-up task suggestion recorded (no calendar invite sent).",
    reversible: true,
    details: { payload },
  };
}
