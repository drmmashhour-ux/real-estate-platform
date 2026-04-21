import type { AutonomousActionCandidate, AutonomousExecutionResult } from "@/modules/autonomy/autonomy.types";

export async function executeTaggingAdapter(
  _candidate: AutonomousActionCandidate,
  payload: Record<string, unknown>
): Promise<AutonomousExecutionResult> {
  return {
    ok: true,
    adapter: "tagging",
    message: "Tag suggestion captured for CRM application after review.",
    reversible: true,
    details: { payload },
  };
}
