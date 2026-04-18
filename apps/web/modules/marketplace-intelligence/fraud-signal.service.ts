import { FraudSignal } from "./marketplace-intelligence.types";

export function detectFraudSignals(input: {
  listing: any;
  host?: any;
  similarListings?: any[];
  reviews?: any[];
  recentBookings?: any[];
}): FraudSignal[] {
  const signals: FraudSignal[] = [];
  const now = new Date().toISOString();

  const price = Number(input.listing?.pricePerNight ?? 0);
  if (price > 0 && price < 20) {
    signals.push({
      listingId: input.listing.id,
      userId: input.listing.hostUserId ?? null,
      signalType: "SUSPICIOUS_PRICE",
      severity: "MEDIUM",
      confidence: 0.75,
      reason: "Listing price appears unusually low for marketplace norms and should be reviewed.",
      evidence: { pricePerNight: price },
      createdAt: now,
    });
  }

  const similar = Array.isArray(input.similarListings) ? input.similarListings : [];
  const duplicateTitle = similar.find(
    (x) =>
      x.id !== input.listing.id &&
      typeof x.title === "string" &&
      x.title.trim().toLowerCase() === String(input.listing.title ?? "").trim().toLowerCase(),
  );
  if (duplicateTitle) {
    signals.push({
      listingId: input.listing.id,
      userId: input.listing.hostUserId ?? null,
      signalType: "DUPLICATE_LISTING",
      severity: "HIGH",
      confidence: 0.8,
      reason: "Possible duplicate listing title detected.",
      evidence: { duplicateListingId: duplicateTitle.id },
      createdAt: now,
    });
  }

  const reviews = Array.isArray(input.reviews) ? input.reviews : [];
  if (reviews.length >= 5) {
    const repeatedLength = new Set(reviews.map((r) => String(r.comment ?? "").length)).size <= 2;
    if (repeatedLength) {
      signals.push({
        listingId: input.listing.id,
        userId: input.listing.hostUserId ?? null,
        signalType: "SUSPICIOUS_REVIEW_PATTERN",
        severity: "MEDIUM",
        confidence: 0.65,
        reason: "Review pattern appears unusually repetitive.",
        evidence: { reviewCount: reviews.length },
        createdAt: now,
      });
    }
  }

  if (!input.host?.governmentIdVerified && !input.host?.identityVerified) {
    signals.push({
      listingId: input.listing.id,
      userId: input.listing.hostUserId ?? null,
      signalType: "HOST_IDENTITY_GAP",
      severity: "LOW",
      confidence: 0.6,
      reason: "Host identity verification appears incomplete.",
      evidence: {},
      createdAt: now,
    });
  }

  return signals;
}
