import { beforeEach, describe, expect, it } from "vitest";
import {
  getGrowthPolicyMonitoringSnapshot,
  resetGrowthPolicyMonitoringForTests,
} from "../growth-policy-monitoring.service";
import { evaluateGrowthPolicies } from "../growth-policy.service";

describe("evaluateGrowthPolicies", () => {
  beforeEach(() => {
    resetGrowthPolicyMonitoringForTests();
  });
  it("flags ads with impressions but zero leads", () => {
    const policies = evaluateGrowthPolicies({
      adsMetrics: { impressions: 100, clicks: 10, leads: 0 },
    });
    expect(policies.some((p) => p.id === "policy-ads-zero-leads")).toBe(true);
    expect(policies.find((p) => p.id === "policy-ads-zero-leads")?.severity).toBe("warning");
  });

  it("flags leads viewed but none unlocked", () => {
    const policies = evaluateGrowthPolicies({
      leadMetrics: { viewed: 12, unlocked: 0 },
    });
    expect(policies.some((p) => p.id === "policy-leads-view-no-unlock")).toBe(true);
  });

  it("governance freeze_recommended is critical", () => {
    const policies = evaluateGrowthPolicies({
      governanceDecision: { status: "freeze_recommended" },
    });
    const g = policies.filter((p) => p.domain === "governance");
    expect(g.some((p) => p.severity === "critical")).toBe(true);
    expect(g[0].id).toBe("policy-governance-freeze-status");
  });

  it("governance human_review_required is critical", () => {
    const policies = evaluateGrowthPolicies({
      governanceDecision: { status: "human_review_required" },
    });
    expect(
      policies.some(
        (p) => p.id === "policy-governance-human-review-status" && p.severity === "critical",
      ),
    ).toBe(true);
  });

  it("does not duplicate policies for overlapping governance statuses", () => {
    const policies = evaluateGrowthPolicies({
      governanceDecision: { status: "freeze_recommended" },
    });
    const titles = policies.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("sorts severity critical before warning before info", () => {
    const policies = evaluateGrowthPolicies({
      governanceDecision: { status: "human_review_required" },
      leadMetrics: { viewed: 5, unlocked: 0 },
      contentMetrics: { generatedCount: 3, engagementCount: 0 },
    });
    const order = policies.map((p) => p.severity);
    const idx = (s: string) => ["critical", "warning", "info"].indexOf(s);
    for (let i = 1; i < order.length; i++) {
      expect(idx(order[i - 1]!)).toBeLessThanOrEqual(idx(order[i]!));
    }
  });

  it("caps output length", () => {
    const policies = evaluateGrowthPolicies({
      governanceDecision: { status: "human_review_required" },
      adsMetrics: { impressions: 200, clicks: 30, leads: 0, conversionRate: 0.001 },
      leadMetrics: { viewed: 20, unlocked: 0, followUpQueue: 10, responded: 1 },
      messagingMetrics: { queued: 12, responded: 2, responseRate: 0.15 },
      brokerMetrics: { activeBrokers: 5, avgCloseRate: 0.05, slowResponseBrokerCount: 4 },
      pricingMetrics: { unstableSignals: true, volatilityScore: 0.9 },
      contentMetrics: { generatedCount: 2, engagementCount: 0 },
      croMetrics: { visits: 300, conversions: 1 },
    });
    expect(policies.length).toBeLessThanOrEqual(12);
  });

  it("missing sections do not crash", () => {
    expect(() => evaluateGrowthPolicies({})).not.toThrow();
    expect(evaluateGrowthPolicies({}).length).toBe(0);
  });
});

describe("monitoring hook", () => {
  it("increments counters via recordGrowthPolicyEvaluation", () => {
    evaluateGrowthPolicies({
      governanceDecision: { status: "freeze_recommended" },
    });
    const snap = getGrowthPolicyMonitoringSnapshot();
    expect(snap.evaluationsCount).toBeGreaterThanOrEqual(1);
  });
});
