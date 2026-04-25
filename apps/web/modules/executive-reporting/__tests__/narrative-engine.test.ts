import { describe, expect, it } from "vitest";
import type { ExecutiveReportForNarrative } from "../narrative-engine.service";
import { generateExecutiveNarrative } from "../narrative-engine.service";

const emptyTrace = { tables: [] as string[], description: "t" };

function traced(v: number | null) {
  return { value: v, trace: emptyTrace };
}

const baseReport = (): ExecutiveReportForNarrative => ({
  schemaVersion: 1,
  periodKey: "2026-04",
  generatedAtUtc: "2026-04-23T00:00:00.000Z",
  summary: {
    headline: "h",
    periodLabel: "2026-04",
    dataFreshnessNote: "note",
  },
  kpi: {
    periodKey: "2026-04",
    range: { startUtc: "2026-04-01T00:00:00.000Z", endUtcExclusive: "2026-05-01T00:00:00.000Z" },
    leadsCreated: traced(10),
    pipelineDealsCreated: traced(2),
    pipelineDealsClosedInPeriod: traced(1),
    committeeFavorableRate: traced(0.6),
    pipelineCapitalRequiredSum: traced(1_000_000),
    avgPipelineCloseCycleDays: traced(14),
    leadContactedOrBeyondRate: traced(0.4),
    leadWonAmongCreatedRate: traced(0.1),
    assumptions: [],
  },
  strategy: {
    benchmarkTop: [
      {
        strategyKey: "s1",
        domain: "OFFER",
        totalUses: 5,
        wins: 3,
        losses: 1,
        stalls: 0,
        avgClosingTime: 10,
        closingSamples: 2,
      },
    ],
    benchmarkWeak: [],
    reinforcementTopArms: [
      { strategyKey: "a1", domain: "OFFER", contextBucket: "b", pulls: 4, avgReward: 0.2 },
    ],
    reinforcementWeakArms: [],
    vsPreviousPeriod: {
      strategyExecutionEventsDelta: 2,
      reinforcementDecisionsDelta: -1,
      trace: emptyTrace,
    },
    assumptions: [],
  },
  portfolio: {
    highRiskDeals: [
      {
        dealId: "deal1",
        title: "Risk deal",
        pipelineStage: "SOURCED",
        underwritingLabel: "WEAK",
        underwritingRecommendation: "AVOID",
        brokerName: "Alex",
      },
    ],
    highOpportunityDeals: [
      {
        dealId: "deal2",
        title: "Opp deal",
        pipelineStage: "DILIGENCE",
        underwritingLabel: "STRONG",
        underwritingRecommendation: "BUY",
        brokerName: null,
      },
    ],
    brokerHighlights: [{ brokerName: "Alex", activeDealCount: 3 }],
    assumptions: [],
  },
  investor: {
    opportunityCountInPeriod: traced(4),
    meanExpectedRoiPercent: traced(8.5),
    riskLevelCounts: { HIGH: 2, LOW: 1 },
    capitalStackTotals: {
      totalCapitalRequiredSum: 500_000,
      seniorDebtSum: 100_000,
      mezzanineSum: 0,
      preferredEquitySum: 0,
      commonEquitySum: 200_000,
      dealsWithStack: 2,
      trace: emptyTrace,
    },
    expansionNotes: ["Note A"],
    assumptions: [],
  },
  autonomy: {
    actionsCreatedInPeriod: traced(6),
    byStatus: { executed: 2, rejected: 1 },
    approvals: traced(2),
    blockedOrRejected: traced(1),
    autonomyModeSummary: "LISTING:abc… mode=ASSIST cap=2",
    assumptions: [],
  },
  recommendations: {
    items: ["Do X"],
    trace: emptyTrace,
  },
});

describe("generateExecutiveNarrative", () => {
  it("mentions only supplied numeric facts in summary", () => {
    const n = generateExecutiveNarrative(baseReport());
    expect(n.summaryText).toContain("2026-04");
    expect(n.summaryText).toContain("10");
    expect(n.summaryText).toContain("6");
  });

  it("includes reinforcement and benchmark insights when present", () => {
    const n = generateExecutiveNarrative(baseReport());
    expect(n.keyInsights.some((x) => x.includes("s1"))).toBe(true);
    expect(n.keyInsights.some((x) => x.includes("a1"))).toBe(true);
  });

  it("caps risks and opportunities at three items", () => {
    const r = baseReport();
    r.portfolio.highRiskDeals = Array.from({ length: 10 }).map((_, i) => ({
      dealId: `id${i}`,
      title: `T${i}`,
      pipelineStage: "SOURCED",
      underwritingLabel: "WEAK",
      underwritingRecommendation: "HOLD",
      brokerName: null,
    }));
    const n = generateExecutiveNarrative(r);
    expect(n.topRisks.length).toBeLessThanOrEqual(3);
    expect(n.topOpportunities.length).toBeLessThanOrEqual(3);
  });
});
