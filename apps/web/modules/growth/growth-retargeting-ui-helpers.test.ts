import { describe, it, expect } from "vitest";
import {
  formatConvRate,
  resolveLearnedListSourceLabel,
  safeSumBookingsFromPerfRows,
} from "./growth-retargeting-ui-helpers";
import { computeSqlLowConversionCaution } from "@/modules/ai-autopilot/actions/ads-automation-loop.autopilot.adapter.helpers";
import { buildUnifiedSnapshot, computeUnifiedAutopilotConfidence } from "./unified-learning.service";

describe("growth-retargeting-ui-helpers", () => {
  it("formatConvRate returns insufficient data for null, NaN, non-finite", () => {
    expect(formatConvRate(null)).toBe("insufficient data");
    expect(formatConvRate(undefined)).toBe("insufficient data");
    expect(formatConvRate(Number.NaN)).toBe("insufficient data");
    expect(formatConvRate(Number.POSITIVE_INFINITY)).toBe("insufficient data");
  });

  it("formatConvRate formats finite rates", () => {
    expect(formatConvRate(0.125)).toBe("12.5%");
  });

  it("safeSumBookingsFromPerfRows ignores malformed rows", () => {
    expect(
      safeSumBookingsFromPerfRows([
        { bookings: 2 },
        { bookings: "x" as unknown as number },
        { bookings: Number.NaN },
        { bookings: 1.7 },
      ]),
    ).toBe(3);
  });

  it("resolveLearnedListSourceLabel clarifies DB snapshot with empty DB lists", () => {
    const s = resolveLearnedListSourceLabel({
      learnedSource: "DB",
      hiDbLen: 0,
      weakDbLen: 0,
      hiMemLen: 2,
      weakMemLen: 0,
    });
    expect(s).toContain("in-memory cache");
  });

  it("resolveLearnedListSourceLabel uses standard labels otherwise", () => {
    expect(
      resolveLearnedListSourceLabel({
        learnedSource: "MEMORY",
        hiDbLen: 0,
        weakDbLen: 0,
        hiMemLen: 1,
        weakMemLen: 0,
      }),
    ).toBe("In-memory (hydrated)");
  });
});

describe("computeSqlLowConversionCaution", () => {
  it("is false when counts absent or zero", () => {
    const base = buildUnifiedSnapshot();
    expect(computeSqlLowConversionCaution({ ...base, sqlLowConversionCounts: undefined })).toBe(false);
    expect(computeSqlLowConversionCaution({ ...base, sqlLowConversionCounts: { cro: 0, retargeting: 0 } })).toBe(false);
  });

  it("is true when cro or retargeting count positive", () => {
    const base = buildUnifiedSnapshot();
    expect(computeSqlLowConversionCaution({ ...base, sqlLowConversionCounts: { cro: 1, retargeting: 0 } })).toBe(true);
  });
});

describe("computeUnifiedAutopilotConfidence", () => {
  it("returns finite confidence when base is non-finite", () => {
    const r = computeUnifiedAutopilotConfidence(Number.NaN);
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(0.95);
  });
});
