import { prisma } from "@/lib/db";

export type PhotoOrderResult = {
  proposedOrderIds: string[];
  reason: string;
  confidenceScore: number;
};

/** Deterministic: cover first, then by descending sortOrder / creation. */
export async function generatePhotoOrderSuggestion(listingId: string): Promise<PhotoOrderResult> {
  const photos = await prisma.bnhubListingPhoto.findMany({
    where: { listingId },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (photos.length === 0) {
    return { proposedOrderIds: [], reason: "No structured photos — upload images in the listing editor first.", confidenceScore: 0 };
  }

  const coverFirst = [...photos].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  const currentIds = photos.map((p) => p.id);
  const proposedIds = coverFirst.map((p) => p.id);
  const changed = proposedIds.some((id, i) => id !== currentIds[i]);

  return {
    proposedOrderIds: proposedIds,
    reason: changed
      ? "Place the cover image first, then follow existing gallery order for consistency."
      : "Photo order already follows cover-first convention.",
    confidenceScore: changed ? 78 : 90,
  };
}
