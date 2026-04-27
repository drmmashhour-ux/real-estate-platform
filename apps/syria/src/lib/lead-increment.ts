import { prisma } from "@/lib/db";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";

/**
 * Best-effort counter for published listing lead taps (WhatsApp / phone).
 * Also logs `lead_whatsapp` / `lead_phone` for daily admin metrics (G4).
 * Does not throw — used from API routes.
 */
export async function incrementListingLeadClicks(
  listingId: string,
  field: "whatsappClicks" | "phoneClicks",
): Promise<void> {
  try {
    const res = await prisma.syriaProperty.updateMany({
      where: { id: listingId, status: "PUBLISHED", fraudFlag: false },
      data: { [field]: { increment: 1 } },
    });
    if (res.count > 0) {
      const eventType = field === "whatsappClicks" ? "lead_whatsapp" : "lead_phone";
      void trackSyriaGrowthEvent({ eventType, propertyId: listingId, payload: { source: "listing_contact" } });
    }
  } catch {
    /* ignore */
  }
}
