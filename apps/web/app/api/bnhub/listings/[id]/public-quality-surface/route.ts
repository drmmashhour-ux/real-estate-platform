import { BnhubLuxuryEligibilityStatus, BnhubLuxuryTierCode, BnhubTrustProfileStatus, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Guest-safe fields only — no fraud evidence, no internal admin notes.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await prisma.shortTermListing.findUnique({
    where: { id },
    select: { id: true, listingStatus: true },
  });
  if (!listing) return Response.json({ error: "Not found" }, { status: 404 });
  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [cls, tier, trust] = await Promise.all([
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId: id } }),
    prisma.bnhubLuxuryTier.findUnique({ where: { listingId: id } }),
    prisma.bnhubTrustProfile.findUnique({ where: { listingId: id } }),
  ]);

  let trustGuestMessage = "Listing is visible on BNHUB.";
  if (trust?.status === BnhubTrustProfileStatus.REVIEW_REQUIRED) {
    trustGuestMessage = "Additional validation may be in progress — this is not a safety guarantee.";
  }
  if (trust?.status === BnhubTrustProfileStatus.RESTRICTED || trust?.status === BnhubTrustProfileStatus.BLOCKED) {
    trustGuestMessage = "This stay may have limited visibility while trust checks complete.";
  }

  /** Only badges that passed automated eligibility (Elite stays in REVIEW_REQUIRED until admin approves). */
  const luxuryTierPublic =
    tier &&
    tier.tierCode !== BnhubLuxuryTierCode.NONE &&
    tier.eligibilityStatus === BnhubLuxuryEligibilityStatus.ELIGIBLE
      ? tier.tierCode
      : null;

  return Response.json({
    starRating: cls?.starRating ?? null,
    ratingLabel: cls?.ratingLabel ?? "BNHUB Star Rating (internal platform estimate)",
    luxuryTierPublic,
    trustGuestMessage,
    pricingNote:
      "Nightly price shown on the listing is set by the host unless BNHUB autopricing is explicitly enabled by policy.",
  });
}
