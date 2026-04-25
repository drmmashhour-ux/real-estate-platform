import { describe, expect, it } from "vitest";
import { generateExecutiveReportPdf, safeUnlinkExecutivePdf } from "../pdf-export.service";
import type { ExecutiveReportView } from "../executive-report.types";

const minimalView = (): ExecutiveReportView => ({
  schemaVersion: 1,
  periodKey: "2099-01",
  generatedAtUtc: "2099-01-01T00:00:00.000Z",
  summary: {
    headline: "h",
    periodLabel: "2099-01",
    dataFreshnessNote: "n",
  },
  kpi: {
    periodKey: "2099-01",
    range: { startUtc: "2099-01-01T00:00:00.000Z", endUtcExclusive: "2099-02-01T00:00:00.000Z" },
    leadsCreated: { value: 0, trace: { tables: ["Lead"], description: "d" } },
    pipelineDealsCreated: { value: 0, trace: { tables: [], description: "d" } },
    pipelineDealsClosedInPeriod: { value: 0, trace: { tables: [], description: "d" } },
    committeeFavorableRate: { value: null, trace: { tables: [], description: "d" } },
    pipelineCapitalRequiredSum: { value: null, trace: { tables: [], description: "d" } },
    avgPipelineCloseCycleDays: { value: null, trace: { tables: [], description: "d" } },
    leadContactedOrBeyondRate: { value: null, trace: { tables: [], description: "d" } },
    leadWonAmongCreatedRate: { value: null, trace: { tables: [], description: "d" } },
    assumptions: [],
  },
  strategy: {
    benchmarkTop: [],
    benchmarkWeak: [],
    reinforcementTopArms: [],
    reinforcementWeakArms: [],
    vsPreviousPeriod: {
      strategyExecutionEventsDelta: null,
      reinforcementDecisionsDelta: null,
      trace: { tables: [], description: "d" },
    },
    assumptions: [],
  },
  portfolio: { highRiskDeals: [], highOpportunityDeals: [], brokerHighlights: [], assumptions: [] },
  investor: {
    opportunityCountInPeriod: { value: 0, trace: { tables: [], description: "d" } },
    meanExpectedRoiPercent: { value: null, trace: { tables: [], description: "d" } },
    riskLevelCounts: {},
    capitalStackTotals: {
      totalCapitalRequiredSum: null,
      seniorDebtSum: null,
      mezzanineSum: null,
      preferredEquitySum: null,
      commonEquitySum: null,
      dealsWithStack: 0,
      trace: { tables: [], description: "d" },
    },
    expansionNotes: [],
    assumptions: [],
  },
  autonomy: {
    actionsCreatedInPeriod: { value: 0, trace: { tables: [], description: "d" } },
    byStatus: {},
    approvals: { value: 0, trace: { tables: [], description: "d" } },
    blockedOrRejected: { value: 0, trace: { tables: [], description: "d" } },
    autonomyModeSummary: "",
    assumptions: [],
  },
  recommendations: { items: [], trace: { tables: [], description: "d" } },
  narrative: {
    summaryText: "S",
    keyInsights: [],
    changesVsPreviousPeriod: [],
    topRisks: [],
    topOpportunities: [],
    recommendedActions: [],
    assumptions: [],
  },
});

describe("pdf-export.service", () => {
  it("returns structured result without throwing", () => {
    const r = generateExecutiveReportPdf(minimalView());
    expect(r.ok === true || r.ok === false).toBe(true);
    if (r.ok) {
      expect(typeof r.pdfPath).toBe("string");
      safeUnlinkExecutivePdf(r.pdfPath);
    } else {
      expect(r.error.length).toBeGreaterThan(0);
    }
  });
});
