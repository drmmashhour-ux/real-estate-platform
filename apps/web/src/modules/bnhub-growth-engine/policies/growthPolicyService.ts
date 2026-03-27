import { ListingStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isLuxuryCategoryStarEligible,
  isPremiumCampaignStarEligible,
} from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";

export type PolicyEvaluation = {
  allowed: boolean;
  reasons: string[];
  flags: Record<string, boolean>;
};

/** Guardrails before autonomous or external launch. Truthful checks only — no fake compliance. */
export async function evaluateLaunchPolicy(listingId: string): Promise<PolicyEvaluation> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      listingStatus: true,
      verificationStatus: true,
      title: true,
      description: true,
      photos: true,
      nightPriceCents: true,
      city: true,
    },
  });
  const reasons: string[] = [];
  const flags: Record<string, boolean> = {};

  if (!listing) {
    return { allowed: false, reasons: ["Listing not found"], flags };
  }

  const approved =
    listing.listingStatus === ListingStatus.APPROVED || listing.listingStatus === ListingStatus.PUBLISHED;
  flags.listingApproved = approved;
  if (!approved) reasons.push("Listing must be APPROVED or PUBLISHED");

  flags.trustOk = listing.verificationStatus === VerificationStatus.VERIFIED;
  if (!flags.trustOk) reasons.push("Verification should be VERIFIED for autopilot / external ads");

  const photos = Array.isArray(listing.photos) ? listing.photos.filter((p): p is string => typeof p === "string") : [];
  flags.minPhotos = photos.length >= 3;
  if (!flags.minPhotos) reasons.push("At least 3 photos recommended for promotion");

  const descLen = (listing.description ?? "").trim().length;
  flags.descriptionOk = descLen >= 80;
  if (!flags.descriptionOk) reasons.push("Description should be substantive (80+ chars) for accurate ads");

  flags.pricingOk = listing.nightPriceCents > 0;
  if (!flags.pricingOk) reasons.push("Nightly price must be set");

  const classification = await prisma.bnhubPropertyClassification.findUnique({
    where: { listingId },
    select: { starRating: true },
  });
  const stars = classification?.starRating ?? 0;
  flags.bnhubStarPremiumEligible = isPremiumCampaignStarEligible(stars);
  flags.bnhubLuxuryCategoryEligible = isLuxuryCategoryStarEligible(stars);

  const allowed = approved && flags.trustOk && flags.pricingOk && flags.minPhotos && flags.descriptionOk;
  return { allowed, reasons, flags };
}
