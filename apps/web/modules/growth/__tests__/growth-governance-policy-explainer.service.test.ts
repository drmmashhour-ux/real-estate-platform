import { describe, expect, it } from "vitest";
import { buildGrowthGovernancePolicyNotes } from "../growth-governance-policy-explainer.service";
import type { GrowthGovernancePolicySnapshot } from "../growth-governance-policy.types";

describe("buildGrowthGovernancePolicyNotes", () => {
  it("returns capped lines", () => {
    const s: GrowthGovernancePolicySnapshot = {
      rules: [
        {
          id: "a",
          domain: "ads",
          mode: "advisory_only",
          rationale: "r",
          source: "default_policy",
          createdAt: "x",
        },
        {
          id: "f",
          domain: "fusion",
          mode: "advisory_only",
          rationale: "r",
          source: "default_policy",
          createdAt: "x",
        },
        {
          id: "l",
          domain: "leads",
          mode: "approval_required",
          rationale: "r",
          source: "default_policy",
          createdAt: "x",
        },
        {
          id: "m",
          domain: "messaging",
          mode: "approval_required",
          rationale: "r",
          source: "default_policy",
          createdAt: "x",
        },
        {
          id: "ap",
          domain: "autopilot",
          mode: "approval_required",
          rationale: "r",
          source: "default_policy",
          createdAt: "x",
        },
      ],
      blockedDomains: [],
      frozenDomains: [],
      reviewRequiredDomains: [],
      notes: [],
      createdAt: "x",
    };
    const lines = buildGrowthGovernancePolicyNotes(s);
    expect(lines.length).toBeLessThanOrEqual(5);
    expect(lines.some((l) => l.includes("Ads"))).toBe(true);
  });
});
