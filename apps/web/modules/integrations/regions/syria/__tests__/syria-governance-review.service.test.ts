import { describe, expect, it } from "vitest";
import { resolveSyriaGovernanceReviewType } from "../syria-governance-review.service";

function policy(decision: "allow_preview" | "requires_local_approval" = "allow_preview") {
  return { decision, rationale: "test" };
}

describe("resolveSyriaGovernanceReviewType", () => {
  it("maps fraudFlag to risk_review", () => {
    expect(resolveSyriaGovernanceReviewType({ policy: policy(), facts: { fraudFlag: true } })).toBe("risk_review");
  });

  it("maps pending listing status to admin_review", () => {
    expect(resolveSyriaGovernanceReviewType({ policy: policy(), facts: { syriaListingStatus: "PENDING_REVIEW" } })).toBe(
      "admin_review",
    );
  });

  it("maps payout_anomaly signal to risk_review when no higher-precedence fact", () => {
    expect(
      resolveSyriaGovernanceReviewType({
        policy: policy(),
        facts: {},
        signals: [{ type: "payout_anomaly", severity: "warning", message: "x", contributingMetrics: {} }],
      }),
    ).toBe("risk_review");
  });

  it("prefers fraud over pending review", () => {
    expect(
      resolveSyriaGovernanceReviewType({
        policy: policy(),
        facts: { fraudFlag: true, syriaListingStatus: "PENDING_REVIEW" },
      }),
    ).toBe("risk_review");
  });

  it("defaults to standard", () => {
    expect(resolveSyriaGovernanceReviewType({ policy: policy(), facts: {} })).toBe("standard");
  });
});
