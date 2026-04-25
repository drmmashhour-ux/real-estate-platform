import { describe, expect, it } from "vitest";
import { computeDealClosingReadiness } from "../closing-readiness.engine";
import type { DealCloserContext } from "../deal-closer.types";

const base = (): DealCloserContext => ({
  engagementScore: 50,
  dealProbability: 50,
  financingReadiness: "unknown",
  urgencyLevel: "medium",
});

describe("computeDealClosingReadiness", () => {
  it("labels not_ready for low scores", () => {
    const r = computeDealClosingReadiness({
      ...base(),
      engagementScore: 20,
      dealProbability: 20,
      silenceGapDays: 10,
    });
    expect(r.score).toBeLessThan(50);
    expect(["not_ready", "warming_up"]).toContain(r.label);
  });

  it("increases for visit and offer signals", () => {
    const r = computeDealClosingReadiness({
      ...base(),
      visitScheduled: true,
      offerDiscussed: true,
      engagementScore: 70,
      dealProbability: 65,
    });
    expect(r.score).toBeGreaterThan(55);
  });
});
