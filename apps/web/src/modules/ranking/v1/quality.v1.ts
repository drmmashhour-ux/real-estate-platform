import { clamp01 } from "./normalize";

export type ListingQualityV1Result = {
  /** 0–100 */
  score: number;
  reasons: string[];
  recommendations: string[];
};

function countJsonStringArray(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  return raw.filter((x) => typeof x === "string" && x.trim().length > 0).length;
}

/**
 * Heuristic listing quality for FSBO rows — complements signalEngine quality (0–1) with explainability.
 */
export function computeFsboListingQualityV1(listing: {
  title: string;
  description: string;
  images: string[];
  address: string;
  city: string;
  priceCents: number;
  propertyType: string | null;
  experienceTags: unknown;
  servicesOffered: unknown;
  trustScore: number | null;
  verificationPresent?: boolean;
}): ListingQualityV1Result {
  const reasons: string[] = [];
  const recommendations: string[] = [];

  const titleLen = listing.title?.trim().length ?? 0;
  const descLen = listing.description?.trim().length ?? 0;
  const imgCount = Array.isArray(listing.images) ? listing.images.filter(Boolean).length : 0;
  const amenityCount =
    countJsonStringArray(listing.experienceTags) + countJsonStringArray(listing.servicesOffered);
  const hasLocation = Boolean(listing.address?.trim() && listing.city?.trim());
  const hasPricing = Number.isFinite(listing.priceCents) && listing.priceCents > 0;
  const hasType = Boolean(listing.propertyType?.trim());

  let acc = 0;
  const wTitle = 0.18;
  const wDesc = 0.22;
  const wImg = 0.2;
  const wAmenity = 0.12;
  const wLoc = 0.1;
  const wPrice = 0.08;
  const wType = 0.05;
  const wTrust = 0.05;

  const titleScore = clamp01(titleLen / 48);
  acc += wTitle * titleScore;
  if (titleLen < 12) {
    reasons.push("short_title");
    recommendations.push("Add a clear, specific title (neighborhood + property type).");
  } else if (titleLen >= 40) {
    reasons.push("descriptive_title");
  }

  const descScore = clamp01(descLen / 800);
  acc += wDesc * descScore;
  if (descLen < 200) {
    reasons.push("thin_description");
    recommendations.push("Expand the description with condition, inclusions, and nearby amenities.");
  } else if (descLen >= 600) {
    reasons.push("rich_description");
  }

  const imgScore = clamp01(imgCount / 12);
  acc += wImg * imgScore;
  if (imgCount < 4) {
    reasons.push("few_photos");
    recommendations.push("Add at least 6–12 photos including exterior, kitchen, and bedrooms.");
  } else if (imgCount >= 8) {
    reasons.push("strong_gallery");
  }

  const amenityScore = clamp01(amenityCount / 8);
  acc += wAmenity * amenityScore;
  if (amenityCount < 2) {
    recommendations.push("Tag experience and services (parking, transit, schools) where applicable.");
  }

  acc += wLoc * (hasLocation ? 1 : 0);
  if (!hasLocation) {
    reasons.push("location_incomplete");
    recommendations.push("Confirm full address and city for buyer trust.");
  }

  acc += wPrice * (hasPricing ? 1 : 0);
  if (!hasPricing) {
    reasons.push("pricing_missing");
    recommendations.push("Set an accurate asking price.");
  }

  acc += wType * (hasType ? 1 : 0);
  if (!hasType) {
    recommendations.push("Select property type (condo, single-family, etc.).");
  }

  const trust01 =
    listing.trustScore != null ? clamp01(listing.trustScore / 100) : listing.verificationPresent ? 0.65 : 0.45;
  acc += wTrust * trust01;
  if (listing.trustScore != null && listing.trustScore < 40) {
    reasons.push("low_trust_signal");
    recommendations.push("Complete verification and disclosure steps to improve trust.");
  }

  return {
    score: Math.round(acc * 100 * 100) / 100,
    reasons,
    recommendations,
  };
}
