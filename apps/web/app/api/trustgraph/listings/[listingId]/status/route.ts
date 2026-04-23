import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { toListingTrustSnapshotDto } from "@/lib/trustgraph/application/dto/listingTrustSnapshotDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { listingStatusParamsSchema } from "@/lib/trustgraph/infrastructure/validation/listingStatusParamsSchema";

export const dynamic = "force-dynamic";

/**
 * Public/seller-facing trust snapshot (no raw signals, fraud codes, or admin notes).
 */
export async function GET(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isTrustGraphEnabled()) {
    return trustgraphJsonError("TrustGraph disabled", 503);
  }

  const raw = await context.params;
  const parsed = listingStatusParamsSchema.safeParse({ listingId: raw.listingId });
  if (!parsed.success) {
    return trustgraphJsonError("Invalid listing id", 400, parsed.error.flatten());
  }

  const userId = await getGuestId();
  if (!userId) {
    return trustgraphJsonError("Unauthorized", 401);
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: parsed.data.listingId },
    select: { ownerId: true },
  });
  if (!listing) {
    return trustgraphJsonError("Not found", 404);
  }

  const admin = await isPlatformAdmin(userId);
  if (!admin && listing.ownerId !== userId) {
    return trustgraphJsonError("Forbidden", 403);
  }

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: parsed.data.listingId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      overallScore: true,
      trustLevel: true,
      readinessLevel: true,
      updatedAt: true,
      summary: true,
    },
  });

  const sellerFacingActionCount = c
    ? await prisma.nextBestAction.count({
        where: {
          caseId: c.id,
          status: "pending",
          actorType: { in: ["user", "broker"] },
        },
      })
    : 0;

  return trustgraphJsonOk({
    snapshot: toListingTrustSnapshotDto({
      caseRow: c,
      sellerFacingActionCount,
    }),
  });
}
