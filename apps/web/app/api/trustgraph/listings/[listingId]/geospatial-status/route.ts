import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { getPhase6MoatConfig } from "@/lib/trustgraph/config/phase6-moat";
import { isTrustGraphEnabled, isTrustGraphGeospatialValidationEnabled } from "@/lib/trustgraph/feature-flags";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { listingStatusParamsSchema } from "@/lib/trustgraph/infrastructure/validation/listingStatusParamsSchema";
import type { GeospatialStatusSafeDto } from "@/lib/trustgraph/application/dto/phase6StatusDto";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphGeospatialValidationEnabled()) {
    return trustgraphJsonError("Geospatial validation disabled", 503);
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

  const row = await prisma.trustgraphGeospatialValidation.findUnique({
    where: { fsboListingId: parsed.data.listingId },
  });
  const labels = getPhase6MoatConfig().safePublicLabels;
  const safe: GeospatialStatusSafeDto = {
    precisionScore: row?.precisionScore ?? null,
    cityAligned: row?.cityMatch ?? null,
    publicMessage:
      row && row.precisionScore != null && row.precisionScore < 0.5 ? labels.addressReview : null,
  };

  return trustgraphJsonOk({
    safe,
    ...(admin && row
      ? {
          admin: {
            ...safe,
            warnings: Array.isArray(row.warnings) ? (row.warnings as string[]) : [],
            providerSummary: row.providerSummary,
          },
        }
      : {}),
  });
}
