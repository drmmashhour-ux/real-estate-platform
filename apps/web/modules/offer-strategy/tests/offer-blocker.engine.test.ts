import { describe, expect, it } from "vitest";
import { detectOfferBlockers } from "../offer-blocker.engine";
import type { OfferStrategyContext } from "../offer-strategy.types";

describe("detectOfferBlockers", () => {
  it("financing and visit blockers", () => {
    const b = detectOfferBlockers({
      financingReadiness: "weak",
      visitCompleted: false,
    } as OfferStrategyContext);
    expect(b.map((x) => x.key)).toContain("financing_uncertainty");
    expect(b.map((x) => x.key)).toContain("no_visit_completed");
  });

  it("fallback when empty", () => {
    const b = detectOfferBlockers({} as OfferStrategyContext);
    expect(b.length).toBeGreaterThan(0);
  });
});
