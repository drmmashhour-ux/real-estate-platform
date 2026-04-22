import { describe, expect, it } from "vitest";
import {
  buildGovernanceAdminDashboardView,
  buildGovernanceAdminSummarySlice,
  buildGovernanceInvestorDashboardView,
  buildGovernanceInvestorSummarySlice,
  GOVERNANCE_INVESTOR_NARRATIVE_CARDS,
  LECIPM_GOVERNANCE_PITCH,
} from "../dashboard/governance-dashboard.service";
import type { UnifiedGovernanceResult } from "../governance/unified-governance.types";

function baseResult(over: Partial<UnifiedGovernanceResult> = {}): UnifiedGovernanceResult {
  return {
    disposition: "ALLOW_PREVIEW",
    allowExecution: false,
    requiresHumanApproval: false,
    blocked: false,
    legalRisk: {
      score: 10,
      level: "LOW",
      reasons: ["l1"],
      requiresBlock: false,
      requiresApproval: false,
    },
    fraudRisk: {
      score: 10,
      level: "LOW",
      reasons: ["f1"],
      revenueImpactEstimate: 0,
      requiresBlock: false,
      requiresApproval: false,
    },
    combinedRisk: { score: 10, level: "LOW" },
    explainability: { summary: "s", lines: [], bullets: [] },
    trace: [{ step: 1, ruleId: "r", matched: true }],
    ...over,
  };
}

describe("governance-dashboard.service", () => {
  it("admin slice includes disposition, levels, trace count, alert severity", () => {
    const admin = buildGovernanceAdminSummarySlice(baseResult({ disposition: "CAUTION_PREVIEW" }));
    expect(admin.disposition).toBe("CAUTION_PREVIEW");
    expect(admin.legalRiskLevel).toBe("LOW");
    expect(admin.fraudRiskLevel).toBe("LOW");
    expect(admin.combinedRiskLevel).toBe("LOW");
    expect(admin.traceCount).toBe(1);
    expect(admin.topReasons.length).toBeLessThanOrEqual(5);
    expect(["none", "info", "warning", "critical"]).toContain(admin.alertSeverity);
  });

  it("investor slice has narrative + fields", () => {
    const inv = buildGovernanceInvestorSummarySlice(baseResult({ blocked: true }));
    expect(inv.governancePosture).toBeTruthy();
    expect(inv.marketplaceProtectionStatus).toBeTruthy();
    expect(inv.revenueAtRisk).toBe(0);
    expect(inv.anomalyLevel).toBe("LOW");
    expect(inv.humanOversightStatus.length).toBeGreaterThan(0);
    expect(inv.narrativeSummary.length).toBeGreaterThan(10);
  });

  it("admin dashboard view maps KPIs, risk cards, governance, revenue, explainability, action", () => {
    const view = buildGovernanceAdminDashboardView(
      baseResult({
        disposition: "REQUIRE_APPROVAL",
        requiresHumanApproval: true,
        explainability: {
          summary: "Composite posture elevated",
          lines: [{ code: "x", label: "L", detail: "D", severity: "warning" }],
          bullets: ["b1"],
        },
      }),
      {
        input: {
          revenueFacts: {
            grossBookingValue30d: 100_000,
            refunds30d: 1000,
            chargebacks30d: 200,
            payoutVolume30d: 40_000,
          },
          signals: [{ type: "payout_anomaly", severity: "critical" }],
        },
      },
    );
    expect(view.kpis.humanApprovalRequired).toBe(true);
    expect(view.kpis.executionReadiness).toBe("approval_required");
    expect(view.riskCards.legal.score).toBe(10);
    expect(view.riskCards.fraud.anomalySources.length).toBeGreaterThan(0);
    expect(view.governance.previewPosture).toBe("review");
    expect(view.revenue.grossBookingValue30d).toBe(100_000);
    expect(view.explainability.bullets).toContain("b1");
    expect(view.action.requestApproval).toBe(true);
  });

  it("investor dashboard view exposes metrics, narrative cards, chart placeholders", () => {
    const view = buildGovernanceInvestorDashboardView(
      baseResult({ fraudRisk: { ...baseResult().fraudRisk, revenueImpactEstimate: 500 } }),
      {
        input: {
          revenueFacts: { grossBookingValue30d: 10_000 },
        },
      },
    );
    expect(view.topMetrics.protectedRevenueEstimate).toBe(9500);
    expect(view.topMetrics.revenueAtRisk).toBe(500);
    expect(view.narrativeCards.length).toBe(GOVERNANCE_INVESTOR_NARRATIVE_CARDS.length);
    expect(view.charts.revenueAtRiskTrend).toBeNull();
  });

  it("pitch snippets are non-empty strings", () => {
    expect(LECIPM_GOVERNANCE_PITCH.short.length).toBeGreaterThan(80);
    expect(LECIPM_GOVERNANCE_PITCH.investor.length).toBeGreaterThan(80);
    expect(LECIPM_GOVERNANCE_PITCH.closing.length).toBeGreaterThan(40);
  });
});
