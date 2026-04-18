import { describe, it, expect } from "vitest";
import { computeListingQualityScore } from "./listing-quality.service";
import { computeListingTrustScore } from "./listing-trust.service";
import { detectFraudSignals } from "./fraud-signal.service";
import { recommendListingPrice } from "./pricing-intelligence.service";
import { computeMarketplaceRankingScore } from "./ranking-engine.service";
import { buildMarketplaceDecisions } from "./marketplace-decision.service";
import { maybeIngestMarketplaceLearning } from "@/modules/growth/unified-learning.service";
import * as rankingBridge from "./marketplace-ranking-bridge";

describe("listing-quality.service", () => {
  it("scores sparse listing lower than a complete listing", () => {
    const sparse = computeListingQualityScore({
      id: "a",
      title: "Hi",
      description: "short",
      photos: [],
      amenities: [],
      pricePerNight: 0,
      city: "",
      address: "",
      maxGuests: 0,
    });
    const complete = computeListingQualityScore({
      id: "b",
      title: "Beautiful downtown loft with parking",
      description: "x".repeat(220),
      photos: Array.from({ length: 9 }, (_, i) => `u${i}`),
      amenities: Array.from({ length: 9 }, (_, i) => `a${i}`),
      pricePerNight: 120,
      city: "Montreal",
      address: "1 Main",
      maxGuests: 4,
    });
    expect(sparse.score).toBeLessThan(complete.score);
    expect(complete.score).toBeGreaterThan(70);
  });
});

describe("listing-trust.service", () => {
  it("rewards verified host and reviews", () => {
    const high = computeListingTrustScore({
      listing: { id: "1", createdAt: new Date(), description: "y".repeat(130), photos: [1, 2, 3, 4] },
      host: { createdAt: new Date() },
      reviews: Array.from({ length: 6 }, () => ({ comment: "ok" })),
      verification: { hostVerified: true, emailVerified: true, phoneVerified: true },
    });
    expect(high.score).toBeGreaterThan(70);
    expect(high.riskFlags.length).toBe(0);
  });

  it("flags risk when verification missing", () => {
    const low = computeListingTrustScore({
      listing: { id: "2", photos: [] },
      reviews: [],
      verification: { hostVerified: false },
    });
    expect(low.riskFlags.length).toBeGreaterThan(0);
  });
});

describe("fraud-signal.service", () => {
  it("detects suspicious price", () => {
    const s = detectFraudSignals({
      listing: { id: "x", title: "T", pricePerNight: 15, hostUserId: "h" },
      host: { identityVerified: true, governmentIdVerified: true },
    });
    expect(s.some((x) => x.signalType === "SUSPICIOUS_PRICE")).toBe(true);
  });

  it("detects duplicate title among similar listings", () => {
    const s = detectFraudSignals({
      listing: { id: "a", title: "Unique Stay Name", pricePerNight: 50, hostUserId: "h" },
      similarListings: [{ id: "b", title: "unique stay name" }],
      host: { identityVerified: true, governmentIdVerified: true },
    });
    expect(s.some((x) => x.signalType === "DUPLICATE_LISTING")).toBe(true);
  });

  it("detects repetitive review lengths", () => {
    const reviews = Array.from({ length: 6 }, () => ({ comment: "great" }));
    const s = detectFraudSignals({
      listing: { id: "z", title: "T", pricePerNight: 99, hostUserId: "h" },
      reviews,
      host: { identityVerified: true, governmentIdVerified: true },
    });
    expect(s.some((x) => x.signalType === "SUSPICIOUS_REVIEW_PATTERN")).toBe(true);
  });
});

describe("pricing-intelligence.service", () => {
  it("returns null when no price", () => {
    expect(
      recommendListingPrice({
        listing: { id: "p", pricePerNight: 0 },
      }),
    ).toBeNull();
  });

  it("suggests downward adjustment on high views and no bookings", () => {
    const r = recommendListingPrice({
      listing: { id: "p", pricePerNight: 200 },
      views: 500,
      bookings: 0,
    });
    expect(r).not.toBeNull();
    expect(r!.adjustmentPercent).toBeLessThan(0);
  });

  it("suggests upward adjustment on strong bookings and occupancy", () => {
    const r = recommendListingPrice({
      listing: { id: "p", pricePerNight: 100 },
      bookings: 6,
      occupancyRate: 0.75,
    });
    expect(r!.adjustmentPercent).toBeGreaterThan(0);
  });
});

describe("ranking-engine.service", () => {
  it("composes weighted score", () => {
    const r = computeMarketplaceRankingScore({
      listingId: "L",
      qualityScore: 80,
      trustScore: 80,
      conversionScore: 60,
      priceFitScore: 60,
      freshnessScore: 60,
    });
    const expected = 80 * 0.28 + 80 * 0.28 + 60 * 0.2 + 60 * 0.14 + 60 * 0.1;
    expect(r.score).toBeCloseTo(expected, 1);
  });

  it("uses lower confidence when component scores are missing", () => {
    const full = computeMarketplaceRankingScore({
      listingId: "A",
      qualityScore: 70,
      trustScore: 70,
      conversionScore: 50,
      priceFitScore: 50,
      freshnessScore: 50,
    });
    const partial = computeMarketplaceRankingScore({
      listingId: "B",
      qualityScore: 70,
      trustScore: 70,
      conversionScore: null,
      priceFitScore: null,
      freshnessScore: null,
    });
    expect(partial.confidence).toBeLessThanOrEqual(full.confidence);
  });
});

describe("marketplace-decision.service", () => {
  const baseQuality = {
    listingId: "l",
    score: 40,
    confidence: 0.7,
    factors: [],
    warnings: ["Thin description"],
    createdAt: new Date().toISOString(),
  };
  const baseTrust = {
    listingId: "l",
    score: 70,
    confidence: 0.8,
    factors: [],
    riskFlags: [],
    createdAt: new Date().toISOString(),
  };
  const baseRanking = {
    listingId: "l",
    score: 80,
    confidence: 0.8,
    components: { quality: 70, trust: 70, conversion: 70, priceFit: 70, freshness: 70 },
    reasons: [],
    createdAt: new Date().toISOString(),
  };

  it("flags fraud review on high severity", () => {
    const d = buildMarketplaceDecisions({
      quality: { ...baseQuality, score: 80 },
      trust: { ...baseTrust, score: 70 },
      ranking: { ...baseRanking, score: 80 },
      fraudSignals: [
        {
          listingId: "l",
          signalType: "DUPLICATE_LISTING",
          severity: "HIGH",
          confidence: 0.9,
          reason: "dup",
          evidence: {},
          createdAt: new Date().toISOString(),
        },
      ],
    });
    expect(d.some((x) => x.type === "FLAG_FOR_FRAUD_REVIEW")).toBe(true);
  });

  it("recommends quality improvements when score low", () => {
    const d = buildMarketplaceDecisions({
      quality: baseQuality,
      trust: baseTrust,
      ranking: { ...baseRanking, score: 50 },
      fraudSignals: [],
    });
    expect(d.some((x) => x.type === "QUALITY_IMPROVEMENT_RECOMMENDED")).toBe(true);
  });

  it("suggests boost when ranking and trust are strong", () => {
    const d = buildMarketplaceDecisions({
      quality: { ...baseQuality, score: 80 },
      trust: { ...baseTrust, score: 65 },
      ranking: { ...baseRanking, score: 76 },
      fraudSignals: [],
    });
    expect(d.some((x) => x.type === "BOOST_LISTING")).toBe(true);
  });
});

describe("unified-learning marketplace hook", () => {
  it("runs without throwing", () => {
    expect(() =>
      maybeIngestMarketplaceLearning({
        listingId: "x",
        rankingScore: 80,
        trustScore: 70,
        fraudHigh: false,
        pricingAdjusted: true,
      }),
    ).not.toThrow();
  });
});

describe("marketplace-ranking-bridge", () => {
  it("exports safe accessors", async () => {
    const m = await import("./marketplace-ranking-bridge");
    expect(typeof m.getListingRankingWeight).toBe("function");
    expect(typeof m.getMarketplaceBoostEligibility).toBe("function");
    expect(typeof m.getMarketplaceDownrankEligibility).toBe("function");
  });
});
