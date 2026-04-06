import { describe, expect, it } from "vitest";
import {
  W_CONSISTENCY,
  W_RELIABILITY,
  W_RESPONSIVENESS,
  W_SATISFACTION,
  autopilotConfidenceMultiplierFromScore,
  classifyHostReputationTier,
  computeHostReputation,
  hostReputationMarketplaceModifier,
  scoreConsistency,
  scoreGuestSatisfaction,
  scoreReliability,
  scoreResponsiveness,
} from "../reputation-engine";
import type { RawHostReputationSignals } from "../reputation-signals";

function baseRaw(over: Partial<RawHostReputationSignals> = {}): RawHostReputationSignals {
  return {
    hostId: "h1",
    terminalBookingCount: 20,
    completedCount: 16,
    cancelledCount: 2,
    completionRate: 16 / 20,
    cancellationRate: 2 / 20,
    disputeCount: 0,
    disputeRate: 0,
    responseRate: 0.95,
    avgResponseTimeHours: 3,
    withGuestMessageCount: 10,
    completedStaysCount: 16,
    checklistDeclaredOnCompletedCount: 14,
    reviewWeightedAverage: 4.5,
    totalReviewCount: 12,
    repeatGuestBookingShare: 0.15,
    totalBookingsAll: 22,
    ...over,
  };
}

describe("computeHostReputation", () => {
  it("produces bounded 0–100 scores from weighted components", () => {
    const raw = baseRaw();
    const rep = computeHostReputation(raw);
    expect(rep.components.reliability).toBeGreaterThanOrEqual(0);
    expect(rep.components.reliability).toBeLessThanOrEqual(100);
    expect(rep.score).toBeGreaterThanOrEqual(0);
    expect(rep.score).toBeLessThanOrEqual(100);
    expect(W_RELIABILITY + W_RESPONSIVENESS + W_SATISFACTION + W_CONSISTENCY).toBeCloseTo(1, 5);
  });

  it("classifies tiers at boundaries", () => {
    expect(classifyHostReputationTier(80)).toBe("excellent");
    expect(classifyHostReputationTier(79.9)).toBe("good");
    expect(classifyHostReputationTier(60)).toBe("good");
    expect(classifyHostReputationTier(59)).toBe("needs_improvement");
    expect(classifyHostReputationTier(40)).toBe("needs_improvement");
    expect(classifyHostReputationTier(39)).toBe("at_risk");
  });

  it("handles missing reviews with neutral satisfaction band", () => {
    const rep = computeHostReputation(
      baseRaw({ reviewWeightedAverage: null, totalReviewCount: 0 }),
    );
    expect(rep.components.guestSatisfaction).toBeGreaterThan(40);
    expect(rep.components.guestSatisfaction).toBeLessThan(70);
  });

  it("does not swing to extremes when history is thin", () => {
    const rep = computeHostReputation(
      baseRaw({
        terminalBookingCount: 3,
        completedCount: 2,
        completionRate: 2 / 3,
        cancellationRate: 0,
        disputeRate: 0,
        disputeCount: 0,
      }),
    );
    expect(rep.limitedHistory).toBe(true);
    expect(rep.score).toBeGreaterThan(25);
    expect(rep.score).toBeLessThan(95);
  });

  it("reduces score when disputes present (explainable penalty)", () => {
    const low = computeHostReputation(baseRaw());
    const highDispute = computeHostReputation(baseRaw({ disputeCount: 4, disputeRate: 0.2 }));
    expect(highDispute.score).toBeLessThan(low.score);
    expect(highDispute.reasons.some((r) => r.includes("Disputes"))).toBe(true);
  });
});

describe("sub-scores", () => {
  it("scoreReliability responds to completion vs cancellation", () => {
    const good = scoreReliability(baseRaw({ completionRate: 0.9, cancellationRate: 0.05 }));
    const bad = scoreReliability(baseRaw({ completionRate: 0.4, cancellationRate: 0.35 }));
    expect(good).toBeGreaterThan(bad);
  });

  it("scoreResponsiveness rewards fast replies", () => {
    const fast = scoreResponsiveness(baseRaw({ avgResponseTimeHours: 1, responseRate: 1, withGuestMessageCount: 5 }));
    const slow = scoreResponsiveness(baseRaw({ avgResponseTimeHours: 100, responseRate: 0.5, withGuestMessageCount: 5 }));
    expect(fast).toBeGreaterThan(slow);
  });

  it("scoreGuestSatisfaction uses neutral when no reviews", () => {
    expect(scoreGuestSatisfaction(baseRaw({ reviewWeightedAverage: null, totalReviewCount: 0 }))).toBeGreaterThan(50);
  });

  it("scoreConsistency uses checklist and repeat share", () => {
    const strong = scoreConsistency(baseRaw({ checklistDeclaredOnCompletedCount: 10, completedStaysCount: 10, repeatGuestBookingShare: 0.4 }));
    const weak = scoreConsistency(baseRaw({ checklistDeclaredOnCompletedCount: 2, completedStaysCount: 10, repeatGuestBookingShare: 0 }));
    expect(strong).toBeGreaterThan(weak);
  });
});

describe("integration helpers", () => {
  it("hostReputationMarketplaceModifier stays in a narrow band", () => {
    expect(hostReputationMarketplaceModifier(0)).toBeCloseTo(0.965, 5);
    expect(hostReputationMarketplaceModifier(100)).toBeCloseTo(1.035, 5);
    expect(hostReputationMarketplaceModifier(null)).toBe(1);
  });

  it("autopilot multiplier is cautious for at-risk scores", () => {
    expect(autopilotConfidenceMultiplierFromScore(30)).toBe(0.88);
    expect(autopilotConfidenceMultiplierFromScore(85)).toBe(1.02);
  });
});
