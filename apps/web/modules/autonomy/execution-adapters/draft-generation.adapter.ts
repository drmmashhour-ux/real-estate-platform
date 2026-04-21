import type { AutonomousActionCandidate, AutonomousExecutionResult } from "@/modules/autonomy/autonomy.types";

/** Draft-only — never sends email/SMS/platform messages. */
export async function executeDraftGenerationAdapter(
  candidate: AutonomousActionCandidate,
  payload: Record<string, unknown>
): Promise<AutonomousExecutionResult> {
  const draft =
    typeof payload.draft === "string"
      ? payload.draft
      : typeof payload.summary === "string"
        ? payload.summary
        : JSON.stringify(payload).slice(0, 2000);
  return {
    ok: true,
    adapter: "draft-generation",
    message: "Draft generated — remains draft until user sends via existing flows.",
    reversible: true,
    details: { actionType: candidate.actionType, draftPreview: draft.slice(0, 280) },
  };
}
