import { describe, expect, it, vi } from "vitest";
import {
  computeListingConversionMetrics,
  buildConversionOptimizationRecommendations,
  evaluateTrustSignalBoost,
  HIGH_VIEWS_THRESHOLD,
  MIN_VIEWS_FOR_CONFIDENCE,
  type ListingContentSnapshot,
} from "../conversion-engine";
import type { AggregatedConversionCounts } from "../conversion-signals";

vi.mock("@/lib/ai/autopilot/autopilot-gate", () => ({
  gateAutopilotRecommendation: vi.fn(async () => ({
    ok: true,
    confidence: 0.72,
    decisionScore: 0.74,
    reasons: [],
    band: "execute",
  })),
}));

function emptyCounts(over: Partial<AggregatedConversionCounts> = {}): AggregatedConversionCounts {
  return {
    searchViews: 0,
    searchClicks: 0,
    behaviorImpressions: 0,
    behaviorClicks: 0,
    bookingAttempts: 0,
    aiSignalsByType: {},
    bookingsCreated: 0,
    bookingsCompleted: 0,
    bookingsAbandoned: 0,
    messagesFromGuests: 0,
    messagesFromHost: 0,
    ...over,
  };
}

function baseListing(over: Partial<ListingContentSnapshot> = {}): ListingContentSnapshot {
  return {
    id: "lst_1",
    title: "Cozy downtown apartment for your stay",
    description: "A".repeat(400),
    photoCount: 8,
    nightPriceCents: 12_000,
    houseRules: "No parties.",
    checkInInstructions: "Lockbox at door.",
    instantBookEnabled: true,
    bnhubListingRatingAverage: 4.5,
    bnhubListingReviewCount: 4,
    bnhubListingCompletedStays: 3,
    ...over,
  };
}

describe("computeListingConversionMetrics", () => {
  it("returns null rates when view data is insufficient (safe handling)", () => {
    const m = computeListingConversionMetrics("lst_1", emptyCounts({ searchViews: 5 }));
    expect(m.sufficientData).toBe(false);
    expect(m.conversionRate).toBeNull();
    expect(m.bookingStartRate).toBeNull();
    expect(m.lowConversion).toBe(false);
  });

  it("detects low conversion when traffic is high and completions are weak", () => {
    const m = computeListingConversionMetrics(
      "lst_1",
      emptyCounts({
        searchViews: HIGH_VIEWS_THRESHOLD + 10,
        behaviorImpressions: 0,
        bookingsCompleted: 0,
        bookingAttempts: 4,
      }),
    );
    expect(m.sufficientData).toBe(true);
    expect(m.listingViews).toBeGreaterThanOrEqual(MIN_VIEWS_FOR_CONFIDENCE);
    expect(m.lowConversion).toBe(true);
    expect(m.explanation.toLowerCase()).toMatch(/booking start/);
  });

  it("does not invent bookings — only real completed rows count", () => {
    const m = computeListingConversionMetrics(
      "lst_1",
      emptyCounts({
        searchViews: 40,
        bookingsCompleted: 0,
      }),
    );
    expect(m.bookingsCompleted).toBe(0);
  });
});

describe("buildConversionOptimizationRecommendations", () => {
  it("returns no fake urgency — only structured improvement hints when low conversion", () => {
    const listing = baseListing();
    const metrics = computeListingConversionMetrics(
      "lst_1",
      emptyCounts({ searchViews: 50, bookingsCompleted: 0 }),
    );
    expect(metrics.lowConversion).toBe(true);
    const recs = buildConversionOptimizationRecommendations(listing, metrics);
    const joined = recs.map((r) => r.summary + r.reasons.join(" ")).join(" ");
    expect(joined.toLowerCase()).not.toMatch(/limited time|only \d+ left|almost sold|hurry/);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.type === "pricing_review")).toBe(true);
  });

  it("suggests friction fixes from missing fields (real listing snapshot only)", () => {
    const listing = baseListing({
      title: "Hi",
      description: "short",
      photoCount: 2,
      houseRules: null,
      checkInInstructions: null,
      instantBookEnabled: false,
    });
    const metrics = computeListingConversionMetrics(
      "lst_1",
      emptyCounts({ searchViews: 50, bookingsCompleted: 0 }),
    );
    const recs = buildConversionOptimizationRecommendations(listing, metrics);
    const friction = recs.find((r) => r.type === "reduce_friction");
    expect(friction).toBeDefined();
    expect(friction?.reasons.some((x) => x.includes("house rules"))).toBe(true);
  });
});

describe("evaluateTrustSignalBoost", () => {
  it("requires real review volume and host performance signals", () => {
    const no = evaluateTrustSignalBoost({
      listingAvgRating: 4.9,
      listingReviewCount: 1,
      completedStays: 5,
      hostCompletionRate: 0.95,
      hostScore: 0.9,
    });
    expect(no.shouldBoost).toBe(false);

    const yes = evaluateTrustSignalBoost({
      listingAvgRating: 4.3,
      listingReviewCount: 5,
      completedStays: 4,
      hostCompletionRate: 0.9,
      hostScore: 0.85,
    });
    expect(yes.shouldBoost).toBe(true);
  });
});

describe("decision engine suppression hook", () => {
  it("gate export is used by integration tests via mock", async () => {
    const { gateConversionRecommendationsForListing } = await import("../conversion-engine");
    const { gateAutopilotRecommendation } = await import("@/lib/ai/autopilot/autopilot-gate");
    vi.mocked(gateAutopilotRecommendation).mockResolvedValueOnce({
      ok: false,
      decisionScore: 0.2,
      reasons: [],
      suppressionReason: "test_suppressed",
    });
    const res = await gateConversionRecommendationsForListing({
      hostId: "h1",
      listingId: "l1",
      metrics: {
        listingId: "l1",
        listingViews: 50,
        listingClicks: 0,
        bookingStarts: 0,
        bookingsCompleted: 0,
        bookingsAbandoned: 0,
        messagesToHost: 0,
        hostMessageResponses: 0,
        conversionRate: 0,
        bookingStartRate: 0,
        abandonmentRate: null,
        lowConversion: true,
        sufficientData: true,
        explanation: "",
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.suppressionReason).toBe("test_suppressed");
  });
});
