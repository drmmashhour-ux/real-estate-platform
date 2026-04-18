import { ListingTrustScore } from "./marketplace-intelligence.types";

export function computeListingTrustScore(input: {
  listing: any;
  host?: any;
  reviews?: any[];
  verification?: any;
}): ListingTrustScore {
  let score = 0;
  const factors: string[] = [];
  const riskFlags: string[] = [];

  if (input.verification?.hostVerified) {
    score += 25;
    factors.push("Host verified");
  } else {
    riskFlags.push("Host not verified");
  }

  if (input.verification?.emailVerified) {
    score += 10;
    factors.push("Email verified");
  }

  if (input.verification?.phoneVerified) {
    score += 10;
    factors.push("Phone verified");
  }

  const reviewCount = Array.isArray(input.reviews) ? input.reviews.length : 0;
  if (reviewCount >= 5) {
    score += 20;
    factors.push("Meaningful review history");
  } else if (reviewCount > 0) {
    score += 10;
    factors.push("Some review history");
  } else {
    riskFlags.push("No review history");
  }

  if (input.listing?.createdAt) {
    score += 10;
    factors.push("Listing metadata present");
  }

  if (input.listing?.photos && input.listing.photos.length >= 4) {
    score += 10;
    factors.push("Listing has sufficient visual evidence");
  }

  if (input.host?.createdAt) {
    score += 5;
    factors.push("Host account history exists");
  }

  if (input.listing?.description && input.listing.description.length >= 120) {
    score += 10;
    factors.push("Listing details reduce ambiguity");
  }

  const confidence = Math.min(
    1,
    0.4 +
      [
        input.verification?.hostVerified,
        input.verification?.emailVerified,
        input.verification?.phoneVerified,
        reviewCount > 0,
        !!input.host?.createdAt,
      ].filter(Boolean).length * 0.1,
  );

  return {
    listingId: input.listing.id,
    score: Math.min(100, score),
    confidence,
    factors,
    riskFlags,
    createdAt: new Date().toISOString(),
  };
}
