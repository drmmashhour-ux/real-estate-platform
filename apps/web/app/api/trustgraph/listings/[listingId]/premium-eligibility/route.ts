import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { isTrustGraphEnabled, isTrustGraphPremiumPlacementEnabled } from "@/lib/trustgraph/feature-flags";
import { computePremiumEligibilityForListing } from "@/lib/trustgraph/infrastructure/services/premiumEligibilityService";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { listingStatusParamsSchema } from "@/lib/trustgraph/infrastructure/validation/listingStatusParamsSchema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphPremiumPlacementEnabled()) {
    return trustgraphJsonError("Premium placement policy disabled", 503);
  }

  const raw = await context.params;
  const parsed = listingStatusParamsSchema.safeParse({ listingId: raw.listingId });
  if (!parsed.success) return trustgraphJsonError("Invalid listing id", 400, parsed.error.flatten());

  const userId = await getGuestId();
  if (!userId) return trustgraphJsonError("Unauthorized", 401);

  const listing = await prisma.fsboListing.findUnique({
    where: { id: parsed.data.listingId },
    select: { ownerId: true },
  });
  if (!listing) return trustgraphJsonError("Not found", 404);

  const admin = await isPlatformAdmin(userId);
  if (!admin && listing.ownerId !== userId) return trustgraphJsonError("Forbidden", 403);

  const result = await computePremiumEligibilityForListing(parsed.data.listingId);

  return trustgraphJsonOk({
    safe: {
      premiumEligible: result.premiumEligible,
      displayableUpgradeGuidance: result.displayableUpgradeGuidance,
    },
    ...(admin ? { admin: result } : {}),
  });
}
