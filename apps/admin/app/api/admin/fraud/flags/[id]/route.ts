import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const flag = await prisma.fraudFlag.findUnique({ where: { id } });
  if (!flag) return Response.json({ error: "Not found" }, { status: 404 });

  const score = await prisma.fraudRiskScore.findUnique({
    where: { entityType_entityId: { entityType: flag.entityType, entityId: flag.entityId } },
  });

  let snapshot: Record<string, unknown> | null = null;
  if (flag.entityType === "listing") {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: flag.entityId },
      select: {
        id: true,
        title: true,
        city: true,
        nightPriceCents: true,
        address: true,
        listingStatus: true,
        ownerId: true,
      },
    });
    snapshot = l ? { listing: l } : null;
  } else if (flag.entityType === "review") {
    const r = await prisma.review.findUnique({
      where: { id: flag.entityId },
      select: {
        id: true,
        propertyRating: true,
        comment: true,
        createdAt: true,
        guestId: true,
        listingId: true,
      },
    });
    snapshot = r ? { review: r } : null;
  }

  let hostSummary: { hostId: string; score: number | null } | null = null;
  if (flag.entityType === "listing" && snapshot?.listing && typeof snapshot.listing === "object") {
    const ownerId = (snapshot.listing as { ownerId?: string }).ownerId;
    if (ownerId) {
      const hp = await prisma.hostPerformance.findUnique({
        where: { hostId: ownerId },
        select: { score: true },
      });
      hostSummary = { hostId: ownerId, score: hp?.score ?? null };
    }
  }

  return Response.json({ flag, score, snapshot, hostSummary });
}
