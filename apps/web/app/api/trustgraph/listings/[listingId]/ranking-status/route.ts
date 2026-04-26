import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { isTrustGraphRankingBoostEnabled } from "@/lib/trustgraph/feature-flags";
import { toListingRankingStatusDtos } from "@/lib/trustgraph/application/dto/rankingStatusDto";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { listingStatusParamsSchema } from "@/lib/trustgraph/infrastructure/validation/listingStatusParamsSchema";
import { computeRankingForSingleListing } from "@/lib/trustgraph/infrastructure/services/listingRankingBoostService";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphRankingBoostEnabled()) {
    return trustgraphJsonError("Ranking boost disabled", 503);
  }

  const raw = await context.params;
  const parsed = listingStatusParamsSchema.safeParse({ listingId: raw.listingId });
  if (!parsed.success) {
    return trustgraphJsonError("Invalid listing id", 400, parsed.error.flatten());
  }

  const listing = await prisma.fsboListing.findUnique({
    where: { id: parsed.data.listingId },
    select: {
      id: true,
      status: true,
      moderationStatus: true,
      ownerId: true,
      featuredUntil: true,
      updatedAt: true,
      images: true,
      sellerDeclarationJson: true,
      sellerDeclarationCompletedAt: true,
    },
  });
  if (!listing) {
    return trustgraphJsonError("Not found", 404);
  }

  const userId = await getGuestId();
  const isPublic = listing.status === "ACTIVE" && listing.moderationStatus === "APPROVED";
  const admin = userId ? await isPlatformAdmin(userId) : false;
  const isOwner = userId === listing.ownerId;
  if (!isPublic && !admin && !isOwner) {
    return trustgraphJsonError("Forbidden", 403);
  }

  const c = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: listing.id },
    orderBy: { updatedAt: "desc" },
    select: { trustLevel: true, readinessLevel: true },
  });

  const internal = computeRankingForSingleListing({
    listing,
    caseRow: c,
  });

  const dtos = toListingRankingStatusDtos(internal, { includeAdmin: admin || isOwner });

  return trustgraphJsonOk({
    safe: dtos.safe,
    ...(dtos.admin ? { admin: dtos.admin } : {}),
  });
}
