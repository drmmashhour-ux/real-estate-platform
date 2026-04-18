import { describe, expect, it } from "vitest";
import { classifyMissionControlStatus } from "../mission-control-status.service";
import type { BNHubMissionControlSummary } from "../mission-control.types";

function sum(over: Partial<BNHubMissionControlSummary>): BNHubMissionControlSummary {
  return {
    weakSignals: [],
    strongSignals: [],
    topRisks: [],
    topOpportunities: [],
    recommendations: [],
    createdAt: new Date().toISOString(),
    ...over,
  };
}

describe("classifyMissionControlStatus", () => {
  it("returns strong when aligned", () => {
    const s = classifyMissionControlStatus(
      sum({
        rankingScore: 70,
        guestConversionStatus: "healthy",
        bookingHealth: "strong",
        hostStatus: "strong",
        topRisks: [],
        weakSignals: [],
      }),
    );
    expect(s).toBe("strong");
  });

  it("returns weak on multiple breakdowns", () => {
    const s = classifyMissionControlStatus(
      sum({
        rankingScore: 20,
        guestConversionStatus: "weak",
        bookingHealth: "weak",
        hostStatus: "weak",
        topRisks: ["a", "b", "c"],
        weakSignals: ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8"],
      }),
    );
    expect(s).toBe("weak");
  });
});
