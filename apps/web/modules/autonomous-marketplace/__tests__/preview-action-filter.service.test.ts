import { describe, expect, it } from "vitest";
import { filterPreviewActionsByPolicy } from "../execution/preview-action-filter.service";
import type { PolicyDecision, ProposedAction } from "../types/domain.types";

function action(id: string): ProposedAction {
  return {
    id,
    type: "UPDATE_LISTING_COPY",
    target: { type: "fsbo_listing", id: "l" },
    confidence: 0.8,
    risk: "LOW",
    title: "t",
    explanation: "e",
    humanReadableSummary: "h",
    metadata: {},
    suggestedAt: "2026-01-01T00:00:00.000Z",
    sourceDetectorId: "d",
    opportunityId: "o",
  };
}

function policyWithDisposition(label: "allow" | "caution" | "blocked_in_preview"): PolicyDecision {
  return {
    id: "pol",
    actionId: "a",
    disposition: label === "blocked_in_preview" ? "BLOCK" : "ALLOW",
    violations: [],
    warnings: [],
    evaluatedAt: "2026-01-01T00:00:00.000Z",
    ruleResults: [
      {
        ruleCode: "preview_pipeline_disposition",
        result: label === "blocked_in_preview" ? "blocked" : "passed",
        reason: `Preview disposition: ${label}`,
      },
    ],
  };
}

describe("filterPreviewActionsByPolicy", () => {
  it("removes blocked actions and preserves order of survivors", () => {
    const a1 = action("x");
    const a2 = action("y");
    const out = filterPreviewActionsByPolicy({
      proposedActions: [a1, a2],
      policyDecisions: [policyWithDisposition("blocked_in_preview"), policyWithDisposition("allow")],
    });
    expect(out.map((x) => x.id)).toEqual(["y"]);
    expect(out[0]?.metadata.previewPolicyStatus).toBe("allow");
    expect(typeof out[0]?.metadata.previewPolicyReason).toBe("string");
  });

  it("keeps caution actions with caution status", () => {
    const a = action("z");
    const out = filterPreviewActionsByPolicy({
      proposedActions: [a],
      policyDecisions: [policyWithDisposition("caution")],
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.metadata.previewPolicyStatus).toBe("caution");
  });

  it("returns empty when decisions length mismatches safely", () => {
    const out = filterPreviewActionsByPolicy({
      proposedActions: [action("a")],
      policyDecisions: [],
    });
    expect(out).toEqual([]);
  });

  it("deterministic output for identical inputs", () => {
    const pa = action("same");
    const pol = policyWithDisposition("allow");
    const one = filterPreviewActionsByPolicy({ proposedActions: [pa], policyDecisions: [pol] });
    const two = filterPreviewActionsByPolicy({ proposedActions: [pa], policyDecisions: [pol] });
    expect(one.map((x) => x.id)).toEqual(two.map((x) => x.id));
    expect(one[0]?.metadata.previewPolicyReason).toEqual(two[0]?.metadata.previewPolicyReason);
  });
});
