/**
 * Integration-style checks: clusters + drift from shaped feedback rows (no HTTP).
 */
import { describe, expect, it } from "vitest";

import {
  analyzeGovernanceIntelligence,
  buildGovernanceClusters,
  buildGovernanceDriftAlerts,
  buildDemoGovernanceFeedbackRecordsForIntelligence,
} from "../feedback/governance-feedback-intelligence.service";
import type { PersistGovernanceFeedbackRecordParams } from "../feedback/governance-feedback.repository";
import type { GovernanceFeedbackInput, GovernanceFeedbackResult } from "../feedback/governance-feedback.types";

function result(partial: Partial<GovernanceFeedbackResult>): GovernanceFeedbackResult {
  return {
    label: "MISSED_RISK",
    confidence: "HIGH",
    falsePositive: false,
    falseNegative: true,
    protectedRevenueEstimate: 0,
    leakedRevenueEstimate: 0,
    reasons: [],
    recommendedActions: [],
    ...partial,
  };
}

function input(actionType: string, regionCode: string, iso: string): GovernanceFeedbackInput {
  return {
    actionType,
    regionCode,
    prediction: {
      governanceDisposition: "ALLOW_PREVIEW",
      blocked: false,
      requiresHumanApproval: false,
      allowExecution: true,
      legalRiskScore: 10,
      legalRiskLevel: "LOW",
      fraudRiskScore: 10,
      fraudRiskLevel: "LOW",
      combinedRiskScore: 10,
      combinedRiskLevel: "LOW",
    },
    truthEvents: [{ type: "chargeback", occurredAt: iso, amount: 200 }],
  };
}

describe("governance-feedback-intelligence (integration)", () => {
  it("repeated MISSED_RISK with leaked revenue becomes a CRITICAL hotspot", () => {
    const action = "SYNC_PAYMENT_RULE";
    const region = "ca_qc";
    const rows: PersistGovernanceFeedbackRecordParams[] = [];
    for (let i = 0; i < 5; i++) {
      rows.push({
        input: input(action, region, `2026-02-${String(10 + i).padStart(2, "0")}T12:00:00.000Z`),
        result: result({
          label: "MISSED_RISK",
          leakedRevenueEstimate: 220,
          falseNegative: true,
        }),
      });
    }

    const clusters = buildGovernanceClusters(rows);
    const critical = clusters.filter((c) => c.severity === "CRITICAL");
    expect(critical.length).toBeGreaterThanOrEqual(1);
    const hotspot = critical.find((c) => c.dimension.includes(action) && c.dimension.includes(region));
    expect(hotspot).toBeDefined();
    expect(hotspot!.labelFocus).toBe("MISSED_RISK");
    expect(hotspot!.caseCount).toBe(5);
    expect(hotspot!.leakedRevenueSum).toBeCloseTo(1100);
  });

  it("demo intelligence bundle exposes CRITICAL cluster(s) and CRITICAL drift", () => {
    const demo = buildDemoGovernanceFeedbackRecordsForIntelligence();
    const analysis = analyzeGovernanceIntelligence(demo);
    expect(analysis.clusters.some((c) => c.severity === "CRITICAL")).toBe(true);
    expect(analysis.driftAlerts.some((d) => d.severity === "CRITICAL")).toBe(true);
  });

  it("surfaces WARNING drift when harmful rate lifts moderately", () => {
    const rows: PersistGovernanceFeedbackRecordParams[] = [];

    let day = 1;
    const pushRow = (label: GovernanceFeedbackResult["label"], harm: boolean, leaked: number, month: number) => {
      rows.push({
        input: input("TASK_A", "ca_on", `2026-${String(month).padStart(2, "0")}-${String(day++).padStart(2, "0")}T12:00:00.000Z`),
        result: result({
          label,
          falseNegative: harm,
          leakedRevenueEstimate: leaked,
        }),
      });
    };

    /** Baseline window (~55% ≈ 11 rows): ~18% harmful */
    for (let i = 0; i < 9; i++) pushRow("GOOD_EXECUTION", false, 0, 1);
    pushRow("MISSED_RISK", true, 40, 1);
    pushRow("MISSED_RISK", true, 40, 1);

    /** Recent window: ~33% harmful — delta triggers WARNING, below CRITICAL drift gates */
    for (let i = 0; i < 6; i++) pushRow("GOOD_EXECUTION", false, 0, 2);
    for (let i = 0; i < 3; i++) pushRow("MISSED_RISK", true, 50, 2);

    const alerts = buildGovernanceDriftAlerts(rows);
    expect(alerts.some((a) => a.severity === "WARNING")).toBe(true);
  });
});
