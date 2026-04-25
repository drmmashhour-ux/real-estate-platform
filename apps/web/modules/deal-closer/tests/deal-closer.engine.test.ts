import { describe, expect, it } from "vitest";
import { runDealCloser } from "../deal-closer.engine";
import type { DealCloserContext } from "../deal-closer.types";

describe("runDealCloser", () => {
  it("returns full output with explainable fields", () => {
    const o = runDealCloser({
      engagementScore: 60,
      dealProbability: 55,
      visitScheduled: true,
      offerDiscussed: false,
      silenceGapDays: 1,
      objections: { objections: [{ type: "price", severity: "medium", confidence: 0.5 }] },
    } as DealCloserContext);
    expect(o.readiness.score).toBeGreaterThanOrEqual(0);
    expect(o.readiness.rationale.length).toBeGreaterThan(0);
    expect(o.nextActions.length).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(o.prematurePushRisk);
    expect(o.closeStrategy.length).toBeGreaterThan(0);
  });
});
