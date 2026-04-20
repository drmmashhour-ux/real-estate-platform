import { beforeEach, describe, expect, it } from "vitest";
import { buildGrowthPolicyFingerprint } from "../growth-policy-fingerprint.service";
import {
  buildGrowthPolicyHistorySummary,
  listGrowthPolicyHistory,
  recordPolicyEvaluationHistory,
} from "../growth-policy-history.service";
import { resetGrowthPolicyHistoryStoreForTests } from "../growth-policy-history.store";
import { deriveGrowthPolicyHistoryStatus } from "../growth-policy-recurrence.service";
import type { GrowthPolicyResult } from "../growth-policy.types";

const adsZeroLeads: GrowthPolicyResult = {
  id: "policy-ads-zero-leads",
  domain: "ads",
  severity: "warning",
  title: "Ads are generating activity but no leads",
  description: "Impressions are present in-window but recorded lead count is zero.",
  recommendation: "Review targeting.",
};

describe("buildGrowthPolicyFingerprint", () => {
  it("is deterministic", () => {
    expect(buildGrowthPolicyFingerprint(adsZeroLeads)).toBe(buildGrowthPolicyFingerprint(adsZeroLeads));
  });

  it("changes when canonical policy id changes", () => {
    const other = { ...adsZeroLeads, id: "policy-ads-low-conversion-rate" };
    expect(buildGrowthPolicyFingerprint(other)).not.toBe(buildGrowthPolicyFingerprint(adsZeroLeads));
  });
});

describe("recordPolicyEvaluationHistory", () => {
  beforeEach(() => {
    resetGrowthPolicyHistoryStoreForTests();
  });

  it("increments seenCount on repeated evaluations", () => {
    recordPolicyEvaluationHistory([adsZeroLeads]);
    recordPolicyEvaluationHistory([adsZeroLeads]);
    const fp = buildGrowthPolicyFingerprint(adsZeroLeads);
    const row = listGrowthPolicyHistory().find((e) => e.fingerprint === fp);
    expect(row?.seenCount).toBe(2);
    expect(row?.currentStatus).toBe("recurring");
  });

  it("does not remove or alter the policy list input (history is additive)", () => {
    const snapshot: GrowthPolicyResult[] = [adsZeroLeads];
    recordPolicyEvaluationHistory(snapshot);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].id).toBe("policy-ads-zero-leads");
  });
});

describe("deriveGrowthPolicyHistoryStatus", () => {
  it("marks resolved_reviewed only when absent and latest review resolved", () => {
    expect(
      deriveGrowthPolicyHistoryStatus({
        activeNow: false,
        seenCount: 3,
        priorStatus: "recurring",
        latestReviewDecision: "resolved",
      }),
    ).toBe("resolved_reviewed");
  });

  it("marks inactive when absent without resolved review", () => {
    expect(
      deriveGrowthPolicyHistoryStatus({
        activeNow: false,
        seenCount: 2,
        priorStatus: "recurring",
        latestReviewDecision: "monitoring",
      }),
    ).toBe("inactive");
  });
});

describe("buildGrowthPolicyHistorySummary", () => {
  beforeEach(() => {
    resetGrowthPolicyHistoryStoreForTests();
  });

  it("counts recurring rows", () => {
    recordPolicyEvaluationHistory([adsZeroLeads]);
    recordPolicyEvaluationHistory([adsZeroLeads]);
    const s = buildGrowthPolicyHistorySummary();
    expect(s.activeRecurringCount).toBeGreaterThanOrEqual(1);
    expect(s.topRecurringFindings.length).toBeGreaterThanOrEqual(1);
  });
});
