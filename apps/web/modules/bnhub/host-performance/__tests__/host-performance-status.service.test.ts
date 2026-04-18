import { describe, expect, it } from "vitest";
import { classifyHostListingPerformance } from "../host-performance-status.service";

describe("classifyHostListingPerformance", () => {
  it("returns strong for high score and few weak signals", () => {
    expect(
      classifyHostListingPerformance({
        rankingScore: 75,
        breakdown: {},
        weakSignals: ["x"],
        strongSignals: ["y"],
        hasFullRanking: true,
      }),
    ).toBe("strong");
  });

  it("returns weak for very low score", () => {
    expect(
      classifyHostListingPerformance({
        rankingScore: 20,
        breakdown: {},
        weakSignals: ["a", "b"],
        strongSignals: [],
        hasFullRanking: true,
      }),
    ).toBe("weak");
  });

  it("degrades gracefully without full ranking", () => {
    expect(
      classifyHostListingPerformance({
        rankingScore: undefined,
        weakSignals: [],
        strongSignals: [],
        hasFullRanking: false,
      }),
    ).toBe("healthy");
  });
});
