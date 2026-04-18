import { logProductEvent } from "@/src/modules/events/event.service";
import { engineFlags } from "@/config/feature-flags";

/** Records a candidate for save-based follow-up (does not send email). */
export async function recordSaveLoopCandidate(params: {
  userId?: string | null;
  sessionId?: string | null;
  listingId: string;
}) {
  if (!engineFlags.growthLoopsV1) return;
  await logProductEvent({
    eventType: "listing_save",
    userId: params.userId,
    sessionId: params.sessionId,
    listingId: params.listingId,
    metadata: { loop: "save_alert_candidate" },
  });
}
