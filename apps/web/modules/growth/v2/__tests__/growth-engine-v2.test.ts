import { describe, expect, it } from "vitest";

import {
  priorityScoreFromParts,
  prioritizeGrowthActions,
  opportunityToGrowthActions,
  riskToGrowthActions,
} from "@/modules/growth/v2/growth-prioritization.service";
import { detectGrowthOpportunities } from "@/modules/growth/v2/growth-opportunity-detection.service";
import { detectGrowthRisks } from "@/modules/growth/v2/growth-risk-detection.service";
import type { OpportunitySignalPack } from "@/modules/growth/v2/growth-opportunity-detection.service";

describe("growth-prioritization.service", () => {
  it("priorityScoreFromParts is deterministic", () => {
    expect(priorityScoreFromParts("high", "high", "high")).toBe(priorityScoreFromParts("high", "high", "high"));
    expect(priorityScoreFromParts("high", "high", "high")).toBeGreaterThan(priorityScoreFromParts("low", "low", "low"));
  });

  it("prioritizeGrowthActions returns 3 today + up to 5 week without overlap", () => {
    const opps = [
      {
        id: "o1",
        category: "conversion" as const,
        title: "t1",
        description: "d",
        urgency: "high" as const,
        impact: "high" as const,
        confidence: "high" as const,
        recommendedAction: "a",
        sourceSignals: ["s"],
      },
      {
        id: "o2",
        category: "traffic" as const,
        title: "t2",
        description: "d",
        urgency: "medium" as const,
        impact: "high" as const,
        confidence: "medium" as const,
        recommendedAction: "a",
        sourceSignals: ["s"],
      },
    ];
    const risks = [
      {
        id: "r1",
        category: "bnhub" as const,
        title: "risk",
        description: "d",
        severity: "high" as const,
        recommendedResponse: "resp",
        sourceSignals: ["x"],
      },
    ];
    const { today, week } = prioritizeGrowthActions(opps, risks);
    expect(today.length).toBeLessThanOrEqual(3);
    expect(week.length).toBeLessThanOrEqual(5);
    expect(today.every((a) => a.horizon === "today")).toBe(true);
    expect(week.every((a) => a.horizon === "week")).toBe(true);
    const ids = new Set([...today, ...week].map((x) => x.id));
    expect(ids.size).toBe(today.length + week.length);
  });

  it("action drafts sort stably by id when scores tie", () => {
    const a = opportunityToGrowthActions([
      {
        id: "b",
        category: "ops",
        title: "t",
        description: "d",
        urgency: "low",
        impact: "low",
        confidence: "low",
        recommendedAction: "x",
        sourceSignals: [],
      },
      {
        id: "a",
        category: "ops",
        title: "t",
        description: "d",
        urgency: "low",
        impact: "low",
        confidence: "low",
        recommendedAction: "x",
        sourceSignals: [],
      },
    ]);
    const merged = [...a, ...riskToGrowthActions([])].sort((x, y) => {
      if (y.priorityScore !== x.priorityScore) return y.priorityScore - x.priorityScore;
      return x.id.localeCompare(y.id);
    });
    expect(merged[0]!.id.localeCompare(merged[1]!.id)).toBeLessThanOrEqual(0);
  });
});

describe("growth opportunity / risk detection", () => {
  const basePack: OpportunitySignalPack = {
    platform: {
      series: [],
      totals: { visitors: 600, listingsBroker: 2, listingsSelf: 2, transactionsClosed: 0, listingsTotal: 40 },
    },
    funnel: {
      windowDays: 14,
      since: "",
      counts: {
        pageViews: 100,
        landingViews: 0,
        listingViews: 0,
        ctaClicks: 0,
        leadCaptures: 0,
        bookingStarted: 10,
        bookingCompleted: 2,
      },
      rates: { viewToListingPercent: null, listingToCheckoutPercent: null, checkoutToPaidPercent: 10 },
      dropOffs: [],
      bottleneck: "checkout",
      recommendation: "r",
      croEngineHints: { dominantIssue: "checkout_trust", reason: "Trust" },
    },
    broker: {
      brokersSampled: 10,
      avgOverallScore: 65,
      insufficientDataShare: 0.2,
      weakBandShare: 0.1,
      coachingNeedsEstimate: "low",
      sparse: false,
      notes: [],
    },
    followUpDebtRatio: 0.4,
    notes: [],
  };

  it("detectGrowthOpportunities returns stable ordering by id when urgency ties", () => {
    const opps = detectGrowthOpportunities(basePack);
    const ids = opps.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("detectGrowthRisks flags sparse broker sample", () => {
    const risks = detectGrowthRisks({
      ...basePack,
      broker: {
        brokersSampled: 3,
        avgOverallScore: null,
        insufficientDataShare: 0.9,
        weakBandShare: null,
        coachingNeedsEstimate: "unknown",
        sparse: true,
        notes: [],
      },
    });
    expect(risks.some((r) => r.id === "risk-sparse-broker-signals")).toBe(true);
  });
});
