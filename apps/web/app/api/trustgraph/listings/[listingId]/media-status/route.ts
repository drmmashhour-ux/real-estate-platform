import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";
import { isTrustGraphEnabled, isTrustGraphMediaClassificationEnabled } from "@/lib/trustgraph/feature-flags";
import { summarizeMediaClassificationForListing } from "@/lib/trustgraph/infrastructure/services/mediaVerificationEvidenceService";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { listingStatusParamsSchema } from "@/lib/trustgraph/infrastructure/validation/listingStatusParamsSchema";
import type { MediaStatusSafeDto } from "@/lib/trustgraph/application/dto/phase6StatusDto";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphMediaClassificationEnabled()) {
    return trustgraphJsonError("Media classification disabled", 503);
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

  const summary = await summarizeMediaClassificationForListing(parsed.data.listingId);

  const safe: MediaStatusSafeDto = {
    exteriorConfidence: summary.exteriorConfidence,
    streetConfidence: summary.streetConfidence,
    documentMismatchHint: summary.documentMismatch,
  };

  return trustgraphJsonOk({
    safe,
    ...(admin
      ? {
          admin: {
            ...summary,
          },
        }
      : {}),
  });
}
