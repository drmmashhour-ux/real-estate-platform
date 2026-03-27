import { describe, expect, it } from "vitest";
import { aggregateFraudScore } from "@/src/modules/bnhub/application/fraudCheckService";

describe("aggregateFraudScore", () => {
  it("caps at 100", () => {
    const s = aggregateFraudScore([
      { checkType: "a", result: "fail", score: 80 },
      { checkType: "b", result: "fail", score: 80 },
    ]);
    expect(s).toBe(100);
  });

  it("weights warnings lower than fails", () => {
    const s = aggregateFraudScore([
      { checkType: "a", result: "warning", score: 100 },
      { checkType: "b", result: "pass", score: 0 },
    ]);
    expect(s).toBeLessThan(100);
    expect(s).toBeGreaterThan(0);
  });
});
