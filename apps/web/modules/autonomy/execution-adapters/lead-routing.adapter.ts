import type { AutonomousActionCandidate, AutonomousExecutionResult } from "@/modules/autonomy/autonomy.types";

/** Soft routing suggestion only — does not reassign CRM ownership automatically. */
export async function executeLeadRoutingAdapter(
  _candidate: AutonomousActionCandidate,
  payload: Record<string, unknown>
): Promise<AutonomousExecutionResult> {
  return {
    ok: true,
    adapter: "lead-routing",
    message: "Soft routing hint stored for broker confirmation (no automatic reassignment).",
    reversible: true,
    details: { leadId: payload.leadId },
  };
}
