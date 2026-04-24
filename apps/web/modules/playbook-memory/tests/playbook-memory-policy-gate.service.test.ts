import { describe, expect, it } from "vitest";
import { evaluatePlaybookEligibility, evaluateRecommendationPolicy } from "../services/playbook-memory-policy-gate.service";

describe("playbook-memory-policy-gate (recommendation / retrieval)", () => {
  it("blocks paused playbook", () => {
    const r = evaluateRecommendationPolicy({
      playbook: {
        status: "PAUSED",
        executionMode: "RECOMMEND_ONLY",
        domain: "PRICING",
      },
      context: { domain: "PRICING", entityType: "listing" },
    });
    expect(r.allowed).toBe(false);
    expect(r.blockedReasons.some((x) => x.toLowerCase().includes("paused"))).toBe(true);
  });

  it("blocks critical policy snapshot", () => {
    const r = evaluateRecommendationPolicy({
      playbook: {
        status: "ACTIVE",
        executionMode: "SAFE_AUTOPILOT",
        domain: "PRICING",
      },
      context: { domain: "PRICING", entityType: "listing" },
      policySnapshot: { severity: "critical" },
    });
    expect(r.allowed).toBe(false);
  });

  it("allows clean active playbook", () => {
    const r = evaluateRecommendationPolicy({
      playbook: {
        status: "ACTIVE",
        executionMode: "RECOMMEND_ONLY",
        domain: "PRICING",
      },
      context: { domain: "PRICING", entityType: "listing" },
    });
    expect(r.allowed).toBe(true);
  });
});

describe("playbook-memory-policy-gate (Wave 6 governance)", () => {
  it("blocks when status is not ACTIVE", () => {
    const r = evaluatePlaybookEligibility({
      status: "PAUSED",
      executionMode: "RECOMMEND_ONLY",
      scoreBand: "MEDIUM",
      avgRiskScore: 0.1,
    });
    expect(r.allowed).toBe(false);
    expect(r.blockedReasons[0]).toMatch(/playbook_status/);
  });

  it("allows RECOMMEND_ONLY when ACTIVE, no critical block, and risk in band", () => {
    const r = evaluatePlaybookEligibility({
      status: "ACTIVE",
      executionMode: "RECOMMEND_ONLY",
      scoreBand: "HIGH",
      avgRiskScore: 0.2,
      policyFlags: { criticalBlock: false },
    });
    expect(r.allowed).toBe(true);
    expect(r.blockedReasons).toEqual([]);
  });

  it("blocks FULL_AUTOPILOT when autonomy does not support autopilot", () => {
    const r = evaluatePlaybookEligibility({
      status: "ACTIVE",
      executionMode: "FULL_AUTOPILOT",
      scoreBand: "HIGH",
      avgRiskScore: 0.1,
      autonomyMode: "RECOMMEND_ONLY",
    });
    expect(r.allowed).toBe(false);
  });
});
