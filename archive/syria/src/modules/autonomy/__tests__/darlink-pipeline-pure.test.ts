import { describe, expect, it, vi } from "vitest";
import type { DarlinkMarketplaceSnapshot, MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import { buildMarketplaceOpportunities } from "../darlink-opportunity-builder.service";
import { buildMarketplaceSignals } from "../darlink-signal-builder.service";
import { resolveMarketplaceGovernance } from "../darlink-autonomy-governance.service";
import { evaluateMarketplacePolicy } from "../darlink-autonomy-policy.service";
import { buildMarketplaceActionProposals } from "../darlink-action-proposal.service";

function emptyPortfolioSnapshot(): DarlinkMarketplaceSnapshot {
  const now = new Date().toISOString();
  return {
    builtAt: now,
    scope: { mode: "portfolio", listingId: null },
    listings: [],
    bookings: [],
    payouts: [],
    leads: [],
    aggregates: {
      totalListings: 0,
      pendingReviewListings: 0,
      featuredListings: 0,
      fraudFlaggedListings: 0,
      stalePublishedLikeCount: 0,
      totalBookings: 0,
      payoutsPending: 0,
      payoutsPaid: 0,
      inquiriesLast30d: 0,
      activeBnhubListings: 0,
    },
    trustHints: { fraudListedCount: 0, fraudBookingCount: 0 },
    rankingHints: { avgFeaturedPriority: 0 },
    growthMetrics: null,
    executionRecent: [],
    autopilotRecommendationsPending: 0,
    notes: ["test_empty"],
  };
}

describe("Darlink autonomy pipeline (pure, no DB)", () => {
  it("signal → opportunity → policy → governance → proposals chain does not throw", () => {
    vi.stubEnv("DARLINK_AUTONOMY_ENABLED", "false");

    const snap = emptyPortfolioSnapshot();
    const signals = buildMarketplaceSignals(snap);
    expect(Array.isArray(signals)).toBe(true);

    const opportunities = buildMarketplaceOpportunities(signals, snap);
    expect(Array.isArray(opportunities)).toBe(true);

    const policy = evaluateMarketplacePolicy({
      snapshot: snap,
      signals,
      opportunities,
    });
    expect(policy.notes).toBeDefined();

    const governance = resolveMarketplaceGovernance();
    expect(governance.mode).toBe("OFF");

    const proposals = buildMarketplaceActionProposals(opportunities, policy, governance);
    expect(Array.isArray(proposals)).toBe(true);

    vi.unstubAllEnvs();
  });

  it("maps fraud_risk signal to reduce_risk-related opportunities", () => {
    const snap = emptyPortfolioSnapshot();
    const signals: MarketplaceSignal[] = [
      {
        id: "fraud:x",
        type: "fraud_risk",
        severity: "critical",
        entityType: "listing",
        entityId: "p1",
        reasonCode: "test",
        metrics: { fraud: 1 },
        explanation: "test fraud",
      },
    ];
    const opportunities = buildMarketplaceOpportunities(signals, snap);
    expect(opportunities.some((o) => o.type === "reduce_risk" || o.type === "request_admin_review")).toBe(true);
  });
});
