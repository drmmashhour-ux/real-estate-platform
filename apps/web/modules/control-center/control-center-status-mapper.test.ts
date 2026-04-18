import { describe, expect, it } from "vitest";
import { mapUnifiedStatus, rankingRecommendationIsBlocked } from "./control-center-status-mapper";

describe("control-center-status-mapper", () => {
  it("maps disabled", () => {
    expect(mapUnifiedStatus({ disabled: true })).toBe("disabled");
  });

  it("maps unavailable after disabled check", () => {
    expect(mapUnifiedStatus({ unavailable: true })).toBe("unavailable");
  });

  it("critical wins over warning", () => {
    expect(mapUnifiedStatus({ hasCriticalSignal: true, hasWarning: true })).toBe("critical");
  });

  it("does not mark critical without signals", () => {
    expect(mapUnifiedStatus({ hasLimitedCoverage: true })).toBe("limited");
  });

  it("ranking rollback detection", () => {
    expect(rankingRecommendationIsBlocked("rollback_recommended")).toBe(true);
    expect(rankingRecommendationIsBlocked("stay_in_shadow")).toBe(true);
    expect(rankingRecommendationIsBlocked("candidate_for_primary")).toBe(false);
  });
});
