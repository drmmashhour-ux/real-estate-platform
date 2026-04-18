import { engineFlags } from "@/config/feature-flags";
import { logProductEvent } from "@/src/modules/events/event.service";

export async function recordReferralSurfaceShown(params: { sessionId?: string | null; source: string }) {
  if (!engineFlags.growthLoopsV1) return;
  await logProductEvent({
    eventType: "cta_clicked",
    sessionId: params.sessionId,
    metadata: { loop: "referral_surface", source: params.source },
  });
}
