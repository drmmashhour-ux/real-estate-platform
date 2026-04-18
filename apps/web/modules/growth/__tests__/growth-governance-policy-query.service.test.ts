import { describe, expect, it } from "vitest";
import {
  formatPolicyModeLabel,
  getPolicyModeForDomain,
  isDomainBlocked,
  requiresHumanReview,
} from "../growth-governance-policy-query.service";
import type { GrowthGovernancePolicySnapshot } from "../growth-governance-policy.types";

const minimalSnapshot = (): GrowthGovernancePolicySnapshot => ({
  rules: [
    {
      id: "1",
      domain: "ads",
      mode: "advisory_only",
      rationale: "r",
      source: "default_policy",
      createdAt: "x",
    },
    {
      id: "2",
      domain: "leads",
      mode: "approval_required",
      rationale: "r2",
      source: "default_policy",
      createdAt: "x",
    },
  ],
  blockedDomains: [],
  frozenDomains: [],
  reviewRequiredDomains: ["leads"],
  notes: [],
  createdAt: "x",
});

describe("growth-governance-policy-query", () => {
  it("getPolicyModeForDomain", () => {
    const s = minimalSnapshot();
    expect(getPolicyModeForDomain("ads", s)).toBe("advisory_only");
  });

  it("requiresHumanReview", () => {
    const s = minimalSnapshot();
    expect(requiresHumanReview("leads", s)).toBe(true);
    expect(requiresHumanReview("ads", s)).toBe(false);
  });

  it("isDomainBlocked", () => {
    const s = minimalSnapshot();
    s.blockedDomains = ["cro"];
    expect(isDomainBlocked("cro", s)).toBe(true);
  });

  it("formatPolicyModeLabel", () => {
    expect(formatPolicyModeLabel("advisory_only")).toBe("Advisory only");
  });
});
