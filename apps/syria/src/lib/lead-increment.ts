import { prisma } from "@/lib/db";

/**
 * Best-effort counter for published listing lead taps (WhatsApp / phone).
 * Does not throw — used from API routes.
 */
export async function incrementListingLeadClicks(
  listingId: string,
  field: "whatsappClicks" | "phoneClicks",
): Promise<void> {
  try {
    await prisma.syriaProperty.updateMany({
      where: { id: listingId, status: "PUBLISHED", fraudFlag: false },
      data: { [field]: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }
}
