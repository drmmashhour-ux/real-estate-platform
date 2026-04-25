import { describe, expect, it } from "vitest";
import { buildStrategyContextBucket, normalizeContextInput } from "../context-bucket.service";

describe("buildStrategyContextBucket", () => {
  it("is stable for the same normalized input", () => {
    const a = normalizeContextInput({
      dealStage: "offer",
      offerReadinessBand: "high",
      financingReadiness: "medium",
      urgency: "high",
      objectionSeverity: "high",
      competitionRisk: "medium",
      visitCompleted: true,
      silenceGapDays: 1,
      engagementScore: 0.8,
    });
    const b = normalizeContextInput({
      dealStage: "offer",
      offerReadinessBand: "high",
      financingReadiness: "medium",
      urgency: "high",
      objectionSeverity: "high",
      competitionRisk: "medium",
      visitCompleted: true,
      silenceGapDays: 1,
      engagementScore: 0.8,
    });
    expect(buildStrategyContextBucket(a)).toBe(buildStrategyContextBucket(b));
  });

  it("uses coarse segments (pipe-delimited)", () => {
    const x = buildStrategyContextBucket(
      normalizeContextInput({
        dealStage: "Stage_A",
        offerReadinessBand: "mid",
        closingReadinessBand: "low",
        financingReadiness: "weak",
        urgency: "low",
        objectionSeverity: "none",
        competitionRisk: "low",
        visitCompleted: false,
        silenceGapDays: 20,
        engagementScore: 0.2,
      })
    );
    expect(x).toMatch(/^stage_a\|/);
    expect(x).toContain("visit_no");
    expect(x.length).toBeLessThanOrEqual(256);
  });
});
