import { logProductEvent } from "@/src/modules/events/event.service";
import { engineFlags } from "@/config/feature-flags";

export async function recordPriceDropSignal(params: {
  listingId: string;
  userId?: string | null;
  sessionId?: string | null;
  previousCents?: number;
  nextCents?: number;
}) {
  if (!engineFlags.growthLoopsV1) return;
  await logProductEvent({
    eventType: "price_drop_seen",
    listingId: params.listingId,
    userId: params.userId,
    sessionId: params.sessionId,
    metadata: {
      loop: "price_drop_candidate",
      previousCents: params.previousCents,
      nextCents: params.nextCents,
    },
  });
}
