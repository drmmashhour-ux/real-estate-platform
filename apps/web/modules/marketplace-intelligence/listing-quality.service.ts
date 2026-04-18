import { ListingQualityScore } from "./marketplace-intelligence.types";

export function computeListingQualityScore(listing: any): ListingQualityScore {
  let score = 0;
  const factors: string[] = [];
  const warnings: string[] = [];

  if (listing.title && listing.title.length >= 12) {
    score += 15;
    factors.push("Strong title");
  } else {
    warnings.push("Weak or short title");
  }

  if (listing.description && listing.description.length >= 200) {
    score += 20;
    factors.push("Detailed description");
  } else {
    warnings.push("Thin description");
  }

  const photoCount = Array.isArray(listing.photos) ? listing.photos.length : 0;
  if (photoCount >= 8) {
    score += 20;
    factors.push("Sufficient photo coverage");
  } else if (photoCount >= 4) {
    score += 10;
    factors.push("Moderate photo coverage");
  } else {
    warnings.push("Low photo coverage");
  }

  const amenityCount = Array.isArray(listing.amenities) ? listing.amenities.length : 0;
  if (amenityCount >= 8) {
    score += 15;
    factors.push("Good amenity coverage");
  } else if (amenityCount === 0) {
    warnings.push("No amenities listed");
  }

  if (listing.pricePerNight && listing.pricePerNight > 0) {
    score += 10;
    factors.push("Price present");
  } else {
    warnings.push("Missing price");
  }

  if (listing.city || listing.address) {
    score += 10;
    factors.push("Location information present");
  } else {
    warnings.push("Location information incomplete");
  }

  if (listing.maxGuests && listing.maxGuests > 0) {
    score += 10;
    factors.push("Guest capacity specified");
  } else {
    warnings.push("Guest capacity missing");
  }

  const normalized = Math.min(100, score);
  const confidence = Math.min(
    1,
    0.5 +
      [listing.title, listing.description, listing.pricePerNight, listing.maxGuests].filter(Boolean).length * 0.1,
  );

  return {
    listingId: listing.id,
    score: normalized,
    confidence,
    factors,
    warnings,
    createdAt: new Date().toISOString(),
  };
}
