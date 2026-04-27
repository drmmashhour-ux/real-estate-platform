import { prisma } from "@/lib/db";
import { computeSy8FeedRankScore } from "@/lib/sy8/sy8-feed-rank-compute";

/**
 * Recompute and persist `sy8FeedRankScore` for one listing (call after location edits or new booking).
 */
export async function recomputeSy8FeedRankForPropertyId(propertyId: string): Promise<void> {
  const id = propertyId.trim();
  if (!id) return;

  const [p, bookingCount] = await Promise.all([
    prisma.syriaProperty.findUnique({
      where: { id },
      include: { owner: true },
    }),
    prisma.syriaBooking.count({ where: { propertyId: id } }),
  ]);

  if (!p) return;

  const score = computeSy8FeedRankScore({
    property: p,
    owner: p.owner,
    bookingCount,
  });

  if (p.sy8FeedRankScore === score) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: { sy8FeedRankScore: score },
  });
}
