import { describe, expect, it } from "vitest";
import {
  MIN_EVALUATION_DAYS,
  computeFlywheelMetricDeltas,
  scoreFlywheelOutcome,
} from "@/modules/growth/flywheel-outcome-scoring.service";
import type { FlywheelMarketplaceMetrics } from "@/modules/marketplace/flywheel.service";

function metrics(partial: Partial<FlywheelMarketplaceMetrics>): FlywheelMarketplaceMetrics {
  return {
    brokerCount: 10,
    leadCount30: 40,
    hotLeads30: 10,
    activeListings: 20,
    leadsUnlocked30: 12,
    wonLeads30: 2,
    leadsPerBroker: 4,
    unlockRate: 0.3,
    hotShare: 0.25,
    winRate: 0.05,
    ...partial,
  };
}

describe("computeFlywheelMetricDeltas", () => {
  it("subtracts baseline from current snapshot fields", () => {
    const baseline = {
      brokerCount: 10,
      leadCount30: 40,
      activeListings: 15,
      unlockRate: 0.2,
      winRate: 0.05,
    };
    const current = metrics({
      brokerCount: 12,
      leadCount30: 55,
      activeListings: 18,
      unlockRate: 0.26,
      winRate: 0.06,
    });
    const d = computeFlywheelMetricDeltas(baseline, current);
    expect(d.brokerCountDelta).toBe(2);
    expect(d.leadCountDelta).toBe(15);
    expect(d.listingCountDelta).toBe(3);
    expect(d.unlockRateDelta).toBeCloseTo(0.06, 5);
    expect(d.conversionRateDelta).toBeCloseTo(0.01, 5);
  });
});

describe("scoreFlywheelOutcome", () => {
  it("returns insufficient_data before minimum evaluation window", () => {
    const baseline = {
      brokerCount: 10,
      leadCount30: 40,
      activeListings: 15,
      unlockRate: 0.2,
      winRate: 0.05,
    };
    const current = metrics({});
    const deltas = computeFlywheelMetricDeltas(baseline, current);
    const r = scoreFlywheelOutcome({
      actionType: "broker_acquisition",
      baseline,
      current,
      deltas,
      daysSinceCreation: MIN_EVALUATION_DAYS - 1,
    });
    expect(r.outcomeScore).toBe("insufficient_data");
  });

  it("scores broker_acquisition positive on +2 brokers after window", () => {
    const baseline = {
      brokerCount: 10,
      leadCount30: 40,
      activeListings: 15,
      unlockRate: 0.2,
      winRate: 0.05,
    };
    const current = metrics({ brokerCount: 12 });
    const deltas = computeFlywheelMetricDeltas(baseline, current);
    const r = scoreFlywheelOutcome({
      actionType: "broker_acquisition",
      baseline,
      current,
      deltas,
      daysSinceCreation: MIN_EVALUATION_DAYS,
    });
    expect(r.outcomeScore).toBe("positive");
  });

  it("marks rate-based outcomes insufficient when windows are thin", () => {
    const baseline = {
      brokerCount: 10,
      leadCount30: 8,
      activeListings: 15,
      unlockRate: 0.15,
      winRate: 0.02,
    };
    const current = metrics({
      leadCount30: 9,
      unlockRate: 0.35,
    });
    const deltas = computeFlywheelMetricDeltas(baseline, current);
    const r = scoreFlywheelOutcome({
      actionType: "conversion_fix",
      baseline,
      current,
      deltas,
      daysSinceCreation: MIN_EVALUATION_DAYS,
    });
    expect(r.outcomeScore).toBe("insufficient_data");
  });
});
