import { describe, expect, it } from "vitest";
import { evaluateSyriaApprovalBoundary } from "../syria-approval-boundary.service";

describe("evaluateSyriaApprovalBoundary", () => {
  it("handles blocked_for_region policy", () => {
    const r = evaluateSyriaApprovalBoundary({
      policy: {
        decision: "blocked_for_region",
        rationale: "",
      },
    });
    expect(r.requiresHumanApprovalHint).toBe(true);
    expect(r.reasons).toContain("policy_blocked_for_region");
  });

  it("always blocks live execution", () => {
    const r = evaluateSyriaApprovalBoundary({
      policy: {
        decision: "allow_preview",
        rationale: "",
      },
    });
    expect(r.liveExecutionBlocked).toBe(true);
    expect(r.reasons).toContain("live_execution_region_block");
  });

  it("requires human hint for requires_local_approval policy", () => {
    const r = evaluateSyriaApprovalBoundary({
      policy: {
        decision: "requires_local_approval",
        rationale: "critical",
      },
    });
    expect(r.requiresHumanApprovalHint).toBe(true);
    expect(r.reasons).toContain("policy_requires_local_approval");
  });

  it("requires human hint for caution_preview", () => {
    const r = evaluateSyriaApprovalBoundary({
      policy: {
        decision: "caution_preview",
        rationale: "",
      },
    });
    expect(r.requiresHumanApprovalHint).toBe(true);
    expect(r.reasons).toContain("policy_caution_preview");
  });

  it("does not require human hint for allow_preview beyond platform notes", () => {
    const r = evaluateSyriaApprovalBoundary({
      policy: {
        decision: "allow_preview",
        rationale: "",
      },
    });
    expect(r.requiresHumanApprovalHint).toBe(false);
    expect(r.reasons).toContain("policy_allow_preview");
  });

  it("never throws", () => {
    expect(() =>
      evaluateSyriaApprovalBoundary({
        policy: { decision: "allow_preview", rationale: "" },
      }),
    ).not.toThrow();
  });
});
