import { describe, expect, it } from "vitest";
import { generateDealInsights } from "./generateDealInsights";
import type { AggregatedDealStats } from "../domain/aggregates";

const base = (over: Partial<AggregatedDealStats> = {}): AggregatedDealStats => ({
  workspaceId: "ws-1",
  historyRows: 10,
  won: 5,
  lost: 3,
  canceled: 2,
  avgDaysToOutcome: 45,
  avgPriceCentsWhenWon: 500_000_00,
  documentRateWhenWon: 0.8,
  bypassFlagRate: 0.02,
  activeBrokersInHistory: 2,
  ...over,
});

describe("generateDealInsights", () => {
  it("returns onboarding copy when no terminal outcomes", () => {
    const r = generateDealInsights(
      base({ won: 0, lost: 0, canceled: 0, historyRows: 0, avgDaysToOutcome: null, documentRateWhenWon: null })
    );
    expect(r.dataScope).toBe("workspace_aggregates_only");
    expect(r.successPatterns.some((s) => s.includes("Record closed"))).toBe(true);
  });

  it("flags low win rate", () => {
    const r = generateDealInsights(base({ won: 1, lost: 8, canceled: 1 }));
    expect(r.riskFactors.some((x) => x.includes("Win rate"))).toBe(true);
  });

  it("flags long cycle times", () => {
    const r = generateDealInsights(base({ avgDaysToOutcome: 120 }));
    expect(r.riskFactors.some((x) => x.includes("cycle"))).toBe(true);
  });

  it("never includes other workspace identifiers in output", () => {
    const r = generateDealInsights(base({ workspaceId: "secret-uuid" }));
    const blob = JSON.stringify(r);
    expect(blob).not.toContain("secret-uuid");
  });
});
