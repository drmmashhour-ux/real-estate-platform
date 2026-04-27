import { describe, expect, it } from "vitest";

import {
  convertSignalsToScore,
  emptyConversionScore,
  getConversionNudge,
} from "../conversionScoringCore";
import type { ConversionSignals } from "../conversionScoringCore";

const empty: ConversionSignals = {
  viewsThisListing: 0,
  viewsInSameCity: 0,
  hasFeedClick: false,
  hasSearchActivity: false,
  hasSavedListing: false,
  hasBookingStarted: false,
  demandScoreForCity: 0,
  priceIncreaseRecommended: false,
};

describe("conversionScoringCore (Order 43)", () => {
  it("new / cold user → low score", () => {
    const s = convertSignalsToScore("L1", "u1", { ...empty });
    expect(s.intentLevel).toBe("low");
    expect(s.score).toBeLessThan(0.2);
  });

  it("repeated views + cross-city activity → medium or higher", () => {
    const s = convertSignalsToScore("L1", "u1", {
      ...empty,
      viewsThisListing: 2,
      viewsInSameCity: 2,
      hasFeedClick: true,
    });
    expect(s.reasons).toContain("repeated_listing_view");
    expect(["medium", "high"]).toContain(s.intentLevel);
  });

  it("booking_started alone → high", () => {
    const s = convertSignalsToScore("L1", "u1", { ...empty, hasBookingStarted: true });
    expect(s.intentLevel).toBe("high");
    expect(s.reasons).toContain("booking_started");
  });

  it("getConversionNudge: high with attention → high copy", () => {
    const s = convertSignalsToScore("L1", "u1", { ...empty, hasBookingStarted: true });
    const n = getConversionNudge(s);
    expect(n.displayLevel).toBe("high");
    expect(n.title).toContain("attention");
  });

  it("empty score safe fallback for API (no data)", () => {
    const e = emptyConversionScore("L1", undefined);
    expect(e.intentLevel).toBe("low");
    const n = getConversionNudge(e);
    expect(n.displayLevel).toBe("low");
  });

  it("high social proof strength adds to score and reason (Order 47)", () => {
    const s = convertSignalsToScore("L1", "u1", { ...empty, socialProofStrength: "high" });
    expect(s.reasons).toContain("High user engagement on this listing");
    expect(s.score).toBeGreaterThan(0.14);
  });

  it("high listing reputation adds +0.1 and reason (Order 48)", () => {
    const s = convertSignalsToScore("L1", "u1", { ...empty, reputationLevel: "high" });
    expect(s.reasons).toContain("Trusted listing with strong performance");
    expect(s.score).toBeGreaterThanOrEqual(0.1);
  });
});
