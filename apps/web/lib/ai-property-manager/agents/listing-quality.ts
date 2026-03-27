/**
 * Listing Quality Agent – improves listing quality and conversion.
 */

import { prisma } from "@/lib/db";
import type { ListingQualityOutput } from "../types";

export async function analyzeListingQuality(listingId: string): Promise<ListingQualityOutput> {
  const listing = await prisma.shortTermListing.findFirst({
    where: { id: listingId },
    select: {
      title: true,
      description: true,
      amenities: true,
      photos: true,
      cancellationPolicy: true,
      houseRules: true,
      listingVerificationStatus: true,
    },
  });
  const factors: string[] = [];
  const missingWarnings: string[] = [];
  const titleImprovements: string[] = [];
  const descriptionImprovements: string[] = [];
  const photoSuggestions: string[] = [];
  const amenitySuggestions: string[] = [];

  if (!listing) {
    return {
      listingQualityScore: 0,
      missingInfoWarnings: ["Listing not found"],
      titleImprovements: [],
      descriptionImprovements: [],
      photoSuggestions: [],
      amenitySuggestions: [],
      confidenceScore: 0,
      reasonSummary: "Listing not found.",
      contributingFactors: [],
      humanReviewRequired: true,
      timestamp: new Date().toISOString(),
    };
  }

  let score = 60;
  if (listing.title && listing.title.length >= 10) {
    score += 5;
    factors.push("Title present and sufficient length");
  } else {
    missingWarnings.push("Title is short or missing");
    titleImprovements.push("Use a clear, descriptive title with location or key feature");
  }
  if (listing.description && listing.description.length >= 100) {
    score += 10;
    factors.push("Description has sufficient detail");
  } else {
    missingWarnings.push("Description may be too short");
    descriptionImprovements.push("Add at least 100 characters describing the space and experience");
  }
  const photoCount = Array.isArray(listing.photos) ? listing.photos.length : 0;
  if (photoCount >= 5) {
    score += 10;
    factors.push("Multiple photos");
  } else {
    photoSuggestions.push("Add at least 5 photos including main living area, bedroom, and bathroom");
  }
  if (listing.listingVerificationStatus === "VERIFIED") {
    score += 10;
    factors.push("Listing is verified");
  } else {
    factors.push("Listing verification missing");
  }
  if (listing.cancellationPolicy) factors.push("Cancellation policy set");
  else factors.push("Cancellation policy missing");

  return {
    listingQualityScore: Math.min(100, score),
    missingInfoWarnings: missingWarnings,
    titleImprovements,
    descriptionImprovements,
    photoSuggestions,
    amenitySuggestions,
    confidenceScore: Math.min(85, 50 + factors.length * 5),
    reasonSummary: `Evaluated title, description, photos (${photoCount}), and verification.`,
    contributingFactors: factors,
    humanReviewRequired: score < 50,
    timestamp: new Date().toISOString(),
  };
}
