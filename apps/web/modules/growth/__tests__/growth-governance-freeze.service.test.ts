import { describe, expect, it } from "vitest";
import { getGrowthFreezeState } from "../growth-governance-freeze.service";
import type { GrowthGovernanceDecision } from "../growth-governance.types";

function baseDecision(over: Partial<GrowthGovernanceDecision> = {}): GrowthGovernanceDecision {
  const d: GrowthGovernanceDecision = {
    status: "healthy",
    topRisks: [],
    blockedDomains: [],
    frozenDomains: [],
    humanReviewItems: [],
    humanReviewQueue: [],
    notes: [],
    createdAt: "2026-04-02T12:00:00.000Z",
  };
  return { ...d, ...over };
}

describe("getGrowthFreezeState", () => {
  it("returns no freeze for healthy", () => {
    const f = getGrowthFreezeState(baseDecision({ status: "healthy" }));
    expect(f.frozenDomains.length).toBe(0);
    expect(f.rationale.some((r) => /No advisory freeze/i.test(r))).toBe(true);
  });

  it("adds light freeze for watch", () => {
    const f = getGrowthFreezeState(baseDecision({ status: "watch" }));
    expect(f.frozenDomains).toContain("ads");
  });

  it("adds strong freeze for freeze_recommended", () => {
    const f = getGrowthFreezeState(baseDecision({ status: "freeze_recommended" }));
    expect(f.frozenDomains).toEqual(expect.arrayContaining(["ads", "cro", "content", "fusion", "autopilot"]));
    expect(f.rationale.length).toBeGreaterThan(0);
  });

  it("uses human-review rationale line for human_review_required", () => {
    const f = getGrowthFreezeState(baseDecision({ status: "human_review_required" }));
    expect(f.rationale.some((r) => /Human review required/i.test(r))).toBe(true);
  });

  it("preserves blockedDomains from decision", () => {
    const f = getGrowthFreezeState(baseDecision({ status: "caution", blockedDomains: ["autopilot"] }));
    expect(f.blockedDomains).toContain("autopilot");
  });
});
