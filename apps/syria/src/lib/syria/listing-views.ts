import { prisma } from "@/lib/db";

/** Bumps the simple view counter for a published listing (best-effort, no throw). */
export async function incrementPublicListingView(listingId: string): Promise<void> {
  try {
    await prisma.syriaProperty.update({
      where: { id: listingId, status: "PUBLISHED", fraudFlag: false },
      data: { views: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }
}
