import type { ExplainableFraudSignal } from "@/src/modules/fraud/types";

export type ListingFraudInput = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  address: string;
  city: string;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  nightPriceCents: number;
  maxGuests: number;
  beds: number;
  baths: number;
  listingStatus: string;
  verificationStatus: string;
  listingVerificationStatus: string;
  houseRules: string | null;
  checkInInstructions: string | null;
  photos: unknown;
  createdAt: Date;
};

export type ListingFraudContext = {
  medianNightPriceCentsSameCity: number | null;
  peerListings: Array<{
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    address: string;
    nightPriceCents: number;
    photos: unknown;
  }>;
  hostRecentListingCount: number;
  hostCancellationRate: number | null;
  hostDisputeRate: number | null;
  photoUrls: string[];
  cityAppearsInAddress: boolean;
};

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter++;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Same host or other-host copy risk via title/description/address similarity.
 */
export function detectDuplicateListingRisk(
  listing: ListingFraudInput,
  ctx: ListingFraudContext
): ExplainableFraudSignal {
  const titleN = normalizeWhitespace(listing.title);
  const descN = listing.description ? normalizeWhitespace(listing.description) : "";
  const addrN = normalizeWhitespace(listing.address);
  const titleTok = tokenSet(listing.title);
  const descTok = listing.description ? tokenSet(listing.description) : new Set<string>();

  let bestJ = 0;
  let bestPeer: string | null = null;
  let sameHostStrong = false;

  for (const p of ctx.peerListings) {
    if (p.id === listing.id) continue;
    const jTitle = jaccard(titleTok, tokenSet(p.title));
    const jDesc = p.description ? jaccard(descTok, tokenSet(p.description)) : 0;
    const j = Math.max(jTitle, jDesc * 0.85);
    if (j > bestJ) {
      bestJ = j;
      bestPeer = p.id;
    }
    const sameAddr = addrN.length > 8 && normalizeWhitespace(p.address) === addrN;
    const sameTitle = titleN.length > 12 && normalizeWhitespace(p.title) === titleN;
    if (p.ownerId === listing.ownerId && (sameAddr || sameTitle || jTitle > 0.72)) {
      sameHostStrong = true;
    }
  }

  const dupPhoto =
    ctx.photoUrls.length > 0 &&
    ctx.peerListings.some(
      (p) =>
        p.ownerId !== listing.ownerId &&
        photoUrlsFromJson(p.photos).some((u) => ctx.photoUrls.includes(u))
    );

  let strength = 0;
  if (sameHostStrong) strength = Math.max(strength, 0.72);
  if (bestJ > 0.55) strength = Math.max(strength, bestJ * 0.9);
  if (dupPhoto) strength = Math.max(strength, 0.65);

  return {
    code: "duplicate_listing",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.35
        ? "Listing text or address closely matches another published listing, or reuses images seen on another host's listing."
        : "No strong duplicate-listing pattern versus recent peers in the same city.",
    details: {
      bestSimilarity: Number(bestJ.toFixed(3)),
      similarPeerId: bestPeer,
      sameHostDuplicateSignals: sameHostStrong,
      crossHostImageOverlap: dupPhoto,
    },
  };
}

function photoUrlsFromJson(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter((x): x is string => typeof x === "string" && x.length > 4);
}

/**
 * Price far below local median or implausible vs capacity with sparse content.
 */
export function detectSuspiciousPriceRisk(
  listing: ListingFraudInput,
  ctx: ListingFraudContext
): ExplainableFraudSignal {
  const med = ctx.medianNightPriceCentsSameCity;
  if (!med || med <= 0) {
    return {
      code: "suspicious_price",
      normalizedStrength: 0,
      humanExplanation: "Insufficient local price baseline to evaluate nightly rate.",
      details: { skipped: true },
    };
  }
  const ratio = listing.nightPriceCents / med;
  let strength = 0;
  if (ratio < 0.35 && listing.nightPriceCents > 0) strength += 0.55;
  else if (ratio < 0.5) strength += 0.35;
  if (ratio > 2.8) {
    const sparse =
      (!listing.description || listing.description.length < 80) &&
      ctx.photoUrls.length < 3;
    if (sparse) strength = Math.max(strength, 0.45);
  }
  const guestPriceMismatch = listing.maxGuests >= 8 && listing.nightPriceCents < med * 0.25;
  if (guestPriceMismatch) strength = Math.max(strength, 0.5);

  return {
    code: "suspicious_price",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.3
        ? "Nightly price is an outlier versus other listings in the same city, or inconsistent with capacity and completeness."
        : "Nightly price is within a plausible band versus city peers.",
    details: {
      nightPriceCents: listing.nightPriceCents,
      medianPeerCents: med,
      ratioToMedian: Number(ratio.toFixed(3)),
    },
  };
}

/**
 * City/region not reflected in address line; optional geo placeholder check.
 */
export function detectLocationConsistencyRisk(
  listing: ListingFraudInput,
  ctx: ListingFraudContext
): ExplainableFraudSignal {
  let strength = 0;
  if (!ctx.cityAppearsInAddress && listing.city.trim().length > 2) strength += 0.4;
  if (listing.latitude != null && listing.longitude != null) {
    if (Math.abs(listing.latitude) < 1e-6 && Math.abs(listing.longitude) < 1e-6) strength += 0.35;
  }
  if (!listing.region && listing.country === "CA" && listing.city) strength += 0.12;

  return {
    code: "inconsistent_location",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.25
        ? "Address text may not align with declared city/region, or coordinates look like placeholders."
        : "Location fields appear broadly consistent.",
    details: {
      city: listing.city,
      region: listing.region,
      cityAppearsInAddress: ctx.cityAppearsInAddress,
      hasCoordinates: listing.latitude != null && listing.longitude != null,
    },
  };
}

/**
 * Too few images vs listing claims; cross-listing image reuse flagged in duplicate signal.
 */
export function detectMediaConsistencyRisk(
  listing: ListingFraudInput,
  ctx: ListingFraudContext
): ExplainableFraudSignal {
  const n = ctx.photoUrls.length;
  let strength = 0;
  if (n === 0) strength = 0.55;
  else if (n === 1) strength = 0.35;
  else if (n < 3 && (!listing.description || listing.description.length < 60)) strength = 0.28;

  return {
    code: "media_inconsistency",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.2
        ? "Photo count is low relative to expectations for a complete short-term listing."
        : "Photo coverage looks adequate at a basic threshold.",
    details: { photoCount: n, listingStatus: listing.listingStatus },
  };
}

export function detectHostBehaviorRisk(hostId: string, ctx: ListingFraudContext): ExplainableFraudSignal {
  let strength = 0;
  if (ctx.hostCancellationRate != null && ctx.hostCancellationRate > 0.35) strength += 0.45;
  else if (ctx.hostCancellationRate != null && ctx.hostCancellationRate > 0.22) strength += 0.25;
  if (ctx.hostDisputeRate != null && ctx.hostDisputeRate > 0.12) strength += 0.35;
  else if (ctx.hostDisputeRate != null && ctx.hostDisputeRate > 0.06) strength += 0.18;
  if (ctx.hostRecentListingCount >= 6) strength += 0.3;
  else if (ctx.hostRecentListingCount >= 4) strength += 0.15;

  return {
    code: "host_behavior_risk",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.25
        ? "Host shows elevated cancellations/disputes or very rapid listing creation."
        : "Host operational signals are within normal heuristic bounds.",
    details: {
      hostId,
      hostCancellationRate: ctx.hostCancellationRate,
      hostDisputeRate: ctx.hostDisputeRate,
      hostRecentListingCount: ctx.hostRecentListingCount,
    },
  };
}

/**
 * Missing disclosures, rules, or verification progress.
 */
export function detectListingCompletenessRisk(listing: ListingFraudInput): ExplainableFraudSignal {
  let strength = 0;
  if (!listing.description || listing.description.trim().length < 40) strength += 0.22;
  if (!listing.houseRules || listing.houseRules.trim().length < 5) strength += 0.15;
  if (!listing.checkInInstructions || listing.checkInInstructions.trim().length < 5) strength += 0.12;
  if (listing.verificationStatus !== "VERIFIED" && listing.listingVerificationStatus !== "VERIFIED")
    strength += 0.12;

  return {
    code: "listing_completeness_risk",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.25
        ? "Listing is missing key guest-facing details or verification is still pending."
        : "Core completeness checks pass at a basic level.",
    details: {
      verificationStatus: listing.verificationStatus,
      listingVerificationStatus: listing.listingVerificationStatus,
    },
  };
}

export function computeListingFraudSignals(
  listing: ListingFraudInput,
  ctx: ListingFraudContext
): ExplainableFraudSignal[] {
  return [
    detectDuplicateListingRisk(listing, ctx),
    detectSuspiciousPriceRisk(listing, ctx),
    detectLocationConsistencyRisk(listing, ctx),
    detectMediaConsistencyRisk(listing, ctx),
    detectHostBehaviorRisk(listing.ownerId, ctx),
    detectListingCompletenessRisk(listing),
  ];
}
