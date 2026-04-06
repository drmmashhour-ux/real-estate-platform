import { describe, expect, it } from "vitest";
import { selectBestTemplateKey, extractAutopilotTemplateKey } from "./template-performance";
import {
  adjustConfidenceByRate,
  confidenceToBucket,
} from "./confidence-calibration";

describe("template performance selection", () => {
  it("falls back to default when no template reaches min impressions", () => {
    const r = selectBestTemplateKey(
      ["a", "b"],
      [
        { templateKey: "a", impressions: 2, successes: 2 },
        { templateKey: "b", impressions: 3, successes: 0 },
      ],
      5
    );
    expect(r.templateKey).toBe("a");
    expect(r.usedFallback).toBe(true);
  });

  it("picks highest success rate among qualified templates", () => {
    const r = selectBestTemplateKey(
      ["a", "b"],
      [
        { templateKey: "a", impressions: 10, successes: 3 },
        { templateKey: "b", impressions: 10, successes: 8 },
      ],
      5
    );
    expect(r.templateKey).toBe("b");
    expect(r.usedFallback).toBe(false);
  });

  it("breaks ties by higher impressions", () => {
    const r = selectBestTemplateKey(
      ["a", "b"],
      [
        { templateKey: "a", impressions: 10, successes: 5 },
        { templateKey: "b", impressions: 20, successes: 10 },
      ],
      5
    );
    expect(r.templateKey).toBe("b");
  });

  it("extractAutopilotTemplateKey reads payload", () => {
    expect(extractAutopilotTemplateKey({ autopilotTemplateKey: "x" })).toBe("x");
    expect(extractAutopilotTemplateKey({})).toBeNull();
  });
});

describe("confidence bucket assignment", () => {
  it("maps normalized confidence to buckets", () => {
    expect(confidenceToBucket(0)).toBe("0-20");
    expect(confidenceToBucket(0.19)).toBe("0-20");
    expect(confidenceToBucket(0.2)).toBe("20-40");
    expect(confidenceToBucket(0.5)).toBe("40-60");
    expect(confidenceToBucket(0.79)).toBe("60-80");
    expect(confidenceToBucket(0.95)).toBe("80-100");
  });
});

describe("confidence adjustment", () => {
  it("returns raw when sample size too small", () => {
    expect(adjustConfidenceByRate(0.8, 0.1, 4)).toBeCloseTo(0.8, 5);
  });

  it("reduces when bucket success rate is low", () => {
    expect(adjustConfidenceByRate(0.8, 0.2, 10)).toBeCloseTo(0.68, 5);
  });

  it("slightly boosts when bucket success rate is high", () => {
    expect(adjustConfidenceByRate(0.7, 0.8, 10)).toBeCloseTo(0.735, 5);
  });

  it("clamps to [0, 1]", () => {
    expect(adjustConfidenceByRate(0, 0.2, 10)).toBe(0);
    expect(adjustConfidenceByRate(0.99, 0.9, 10)).toBe(1);
  });
});
