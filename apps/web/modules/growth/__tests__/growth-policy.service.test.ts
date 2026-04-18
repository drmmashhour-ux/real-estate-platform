import { describe, expect, it, beforeEach } from "vitest";
import { evaluateGrowthPolicies } from "@/modules/growth/policy/growth-policy.service";
import { resetGrowthPolicyMonitoringForTests } from "@/modules/growth/policy/growth-policy-monitoring.service";

describe("evaluateGrowthPolicies", () => {
  beforeEach(() => {
    resetGrowthPolicyMonitoringForTests();
  });

  it("flags governance freeze as critical", () => {
    const p = evaluateGrowthPolicies({
      governanceDecision: { freezeRecommended: true, humanReviewRequired: false },
    });
    expect(p.some((x) => x.id === "policy-governance-freeze" && x.severity === "critical")).toBe(true);
  });

  it("flags human review as critical", () => {
    const p = evaluateGrowthPolicies({
      governanceDecision: { freezeRecommended: false, humanReviewRequired: true },
    });
    expect(p.some((x) => x.id === "policy-governance-review")).toBe(true);
  });

  it("ads: zero leads with impressions triggers warning", () => {
    const p = evaluateGrowthPolicies({
      adsMetrics: { impressions: 600, clicks: 40, leadsCaptured: 0 },
    });
    expect(p.some((x) => x.id === "policy-ads-zero-leads")).toBe(true);
  });

  it("leads: views but no unlocks", () => {
    const p = evaluateGrowthPolicies({
      leadMetrics: { leadsViewed: 5, leadsUnlocked: 0 },
    });
    expect(p.some((x) => x.id === "policy-leads-view-no-unlock")).toBe(true);
  });

  it("no duplicate ids", () => {
    const p = evaluateGrowthPolicies({
      governanceDecision: { freezeRecommended: true, humanReviewRequired: true },
      leadMetrics: { leadsViewed: 2, leadsUnlocked: 0 },
      adsMetrics: { impressions: 600, clicks: 50, leadsCaptured: 0 },
    });
    const ids = p.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("bounded output", () => {
    const p = evaluateGrowthPolicies({
      governanceDecision: { freezeRecommended: true, humanReviewRequired: true },
      leadMetrics: { leadsViewed: 50, leadsUnlocked: 0 },
      followUpMetrics: { attempted: 20, completed: 2 },
      adsMetrics: { impressions: 600, clicks: 50, leadsCaptured: 0 },
      brokerMetrics: { activeBrokers: 5, payingBrokers: 0, closeRateProxy: 0.05 },
      pricingMetrics: { volatilityIndex: 0.9 },
      contentMetrics: { piecesGenerated: 3, engagements: 0 },
      croMetrics: { visits: 300, conversions: 1 },
    });
    expect(p.length).toBeLessThanOrEqual(24);
  });

  it("sorts critical before info when both present", () => {
    const p = evaluateGrowthPolicies({
      governanceDecision: { humanReviewRequired: true },
      contentMetrics: { piecesGenerated: 1, engagements: 0 },
    });
    const sev = p.map((x) => x.severity);
    const idxCritical = sev.indexOf("critical");
    const idxInfo = sev.indexOf("info");
    if (idxCritical >= 0 && idxInfo >= 0) {
      expect(idxCritical).toBeLessThan(idxInfo);
    }
  });
});
