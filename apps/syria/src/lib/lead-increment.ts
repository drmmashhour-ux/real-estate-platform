import { prisma } from "@/lib/db";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { utcDayKey } from "@/lib/syria/share-abuse";

/**
 * Best-effort counter for published listing lead taps (WhatsApp / phone).
 * Also logs `lead_whatsapp` / `lead_phone` for daily admin metrics (G4), plus canonical `contact_click` (SYBNB-112).
 * ORDER SYBNB-113 — duplicate taps from same IP same UTC day are ignored (no counter increment, no growth events).
 * Does not throw — used from API routes.
 */
export async function incrementListingLeadClicks(
  listingId: string,
  field: "whatsappClicks" | "phoneClicks",
  opts?: { clientIpHash?: string | null },
): Promise<void> {
  try {
    const channel = field === "whatsappClicks" ? "whatsapp" : "tel";
    const dayUtc = utcDayKey();

    if (opts?.clientIpHash) {
      const inserted = await prisma.syriaListingContactDedupe.createMany({
        data: [{ propertyId: listingId, ipHash: opts.clientIpHash, channel, dayUtc }],
        skipDuplicates: true,
      });
      if (inserted.count === 0) return;
    }

    const res = await prisma.syriaProperty.updateMany({
      where: { id: listingId, status: "PUBLISHED", fraudFlag: false },
      data: { [field]: { increment: 1 } },
    });
    if (res.count > 0) {
      const eventType = field === "whatsappClicks" ? "lead_whatsapp" : "lead_phone";
      void trackSyriaGrowthEvent({ eventType, propertyId: listingId, payload: { source: "listing_contact" } });
      void trackSyriaGrowthEvent({
        eventType: "contact_click",
        propertyId: listingId,
        payload: { channel: field === "whatsappClicks" ? "whatsapp" : "tel" },
      });
      void import("@/lib/sy8/sy8-feed-rank-refresh").then((m) => m.recomputeSy8FeedRankForPropertyId(listingId));
    }
  } catch {
    /* ignore */
  }
}
