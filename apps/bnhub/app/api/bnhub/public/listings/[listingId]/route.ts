import { prisma } from "@repo/db";
import { getPublicBnhubListingDetail } from "@/lib/bnhub/public-supabase-listings-read";
import { getListingTrustSnapshot } from "@/lib/bnhub/two-sided-trust-sync";

export const dynamic = "force-dynamic";

/** GET /api/bnhub/public/listings/[listingId] — property detail + gallery + review summary (platform-owned). */
export async function GET(_req: Request, context: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await context.params;
  const result = await getPublicBnhubListingDetail(listingId ?? "", 8);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const lid = (listingId ?? "").trim();
  const prismaListing =
    lid.length > 0
      ? await prisma.shortTermListing
          .findUnique({
            where: { id: lid },
            select: { requireGuestIdentityVerification: true },
          })
          .catch(() => null)
      : null;
  const trust = lid.length > 0 ? await getListingTrustSnapshot(lid).catch(() => null) : null;
  return Response.json({
    ...result.detail,
    require_guest_identity_verification: prismaListing?.requireGuestIdentityVerification ?? false,
    trust: trust
      ? {
          hostRating: trust.ratingAverage,
          reviewCount: trust.reviewCount,
          completedBookings: trust.completedStays,
          hostVerified: trust.hostVerified,
          topHost: trust.topHost,
        }
      : null,
  });
}
