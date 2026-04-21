import type { AutonomousActionCandidate, AutonomousExecutionResult } from "@/modules/autonomy/autonomy.types";

export async function executeRankingAdapter(
  _candidate: AutonomousActionCandidate,
  payload: Record<string, unknown>
): Promise<AutonomousExecutionResult> {
  return {
    ok: true,
    adapter: "ranking",
    message: "Internal ranking weight suggestion applied in shadow (no public sort mutation).",
    reversible: true,
    details: { listingId: payload.listingId, weight: payload.weight },
  };
}
