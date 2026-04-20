import { describe, expect, it } from "vitest";
import {
  buildGovernanceAdminSummarySlice,
  buildGovernanceInvestorSummarySlice,
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
});
