import { engineFlags } from "@/config/feature-flags";
import { logProductEvent } from "@/src/modules/events/event.service";

export async function recordReengagementCandidate(params: { userId?: string | null; reason: string }) {
  if (!engineFlags.growthLoopsV1) return;
  await logProductEvent({
    eventType: "recommendation_impression",
    userId: params.userId,
    metadata: { loop: "reengagement_candidate", reason: params.reason },
  });
}
