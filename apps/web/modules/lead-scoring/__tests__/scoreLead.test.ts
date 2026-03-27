import { describe, expect, it } from "vitest";
import { scoreLeadFromSignals } from "../application/scoreLead";

describe("scoreLeadFromSignals", () => {
  it("high activity maps to high category", () => {
    const r = scoreLeadFromSignals({
      listingCount: 5,
      copilotRunCount: 10,
      dealAnalysisCount: 5,
      verifiedListingCount: 2,
      hasActiveWorkspaceSubscription: true,
      daysSinceLastActivity: 1,
    });
    expect(r.category).toBe("high");
    expect(r.score).toBeGreaterThan(66);
  });

  it("inactive user is penalized", () => {
    const active = scoreLeadFromSignals({
      listingCount: 2,
      copilotRunCount: 2,
      dealAnalysisCount: 1,
      verifiedListingCount: 0,
      hasActiveWorkspaceSubscription: false,
      daysSinceLastActivity: 2,
    });
    const inactive = scoreLeadFromSignals({
      listingCount: 2,
      copilotRunCount: 2,
      dealAnalysisCount: 1,
      verifiedListingCount: 0,
      hasActiveWorkspaceSubscription: false,
      daysSinceLastActivity: 20,
    });
    expect(inactive.score).toBeLessThan(active.score);
    expect(inactive.reasons.some((x) => x.includes("Inactive"))).toBe(true);
  });
});
