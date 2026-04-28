import { prisma } from "@/lib/db";

const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export type PublicListingViewResult = {
  /** True when `views` was incremented (and growth/analytics should mirror). */
  counted: boolean;
};

function viewerFingerprint(viewerUserId: string | null, viewerIp: string): string {
  const trimmed = viewerUserId?.trim();
  if (trimmed) return `u:${trimmed}`;
  const ip = viewerIp.trim() || "0";
  return `ip:${ip.slice(0, 128)}`;
}

/**
 * ORDER SYBNB-126 — bump `views` (+ optional `uniqueViews`) only when:
 * - viewer is not the listing owner
 * - same viewer fingerprint had no counted view in the last **30 minutes**
 *
 * First-ever fingerprint for this listing increments both `views` and `uniqueViews`.
 * Repeat visits after the window increment `views` only.
 */
export async function incrementPublicListingView(args: {
  listingId: string;
  ownerId: string;
  viewerUserId: string | null;
  viewerIp: string;
}): Promise<PublicListingViewResult> {
  const { listingId, ownerId, viewerUserId, viewerIp } = args;

  if (viewerUserId && viewerUserId === ownerId) {
    return { counted: false };
  }

  const viewerKey = viewerFingerprint(viewerUserId, viewerIp);
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const listing = await tx.syriaProperty.findFirst({
        where: {
          id: listingId,
          status: "PUBLISHED",
          fraudFlag: false,
          needsReview: false,
          owner: { flagged: false },
        },
        select: { id: true },
      });
      if (!listing) return { counted: false };

      const existing = await tx.syriaListingViewVisit.findUnique({
        where: {
          propertyId_viewerKey: { propertyId: listingId, viewerKey },
        },
      });

      if (!existing) {
        await tx.syriaListingViewVisit.create({
          data: { propertyId: listingId, viewerKey, lastSeenAt: now },
        });
        await tx.syriaProperty.update({
          where: { id: listingId },
          data: {
            views: { increment: 1 },
            uniqueViews: { increment: 1 },
          },
        });
        return { counted: true };
      }

      const elapsed = now.getTime() - existing.lastSeenAt.getTime();
      if (elapsed < VIEW_DEDUPE_WINDOW_MS) {
        return { counted: false };
      }

      await tx.syriaListingViewVisit.update({
        where: {
          propertyId_viewerKey: { propertyId: listingId, viewerKey },
        },
        data: { lastSeenAt: now },
      });
      await tx.syriaProperty.update({
        where: { id: listingId },
        data: { views: { increment: 1 } },
      });
      return { counted: true };
    });
  } catch {
    return { counted: false };
  }
}
