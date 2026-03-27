import type { Offer, OfferEvent } from "@prisma/client";

export function filterEventsForViewer(
  events: OfferEvent[],
  viewer: "buyer" | "broker"
): OfferEvent[] {
  if (viewer === "broker") return events;
  return events.filter((e) => {
    if (e.type !== "NOTE_ADDED") return true;
    const m = e.metadata as { internalNote?: boolean; visibleToBuyer?: boolean } | null;
    if (m?.internalNote && !m?.visibleToBuyer) return false;
    return true;
  });
}

export type OfferWithRelations = Offer & {
  events: OfferEvent[];
  buyer?: { name: string | null; email: string };
};
