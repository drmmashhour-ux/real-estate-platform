import { describe, expect, it } from "vitest";
import { detectContradictions } from "@/src/modules/legal-intelligence-graph/rules/contradictionDetectionService";
import { detectMissingDependencies } from "@/src/modules/legal-intelligence-graph/rules/dependencyRuleService";
import { detectReviewBlockers } from "@/src/modules/legal-intelligence-graph/rules/reviewBlockerService";
import { detectSignatureBlockers } from "@/src/modules/legal-intelligence-graph/rules/signatureBlockerService";
import { detectWorkflowInconsistencies } from "@/src/modules/legal-intelligence-graph/rules/workflowConsistencyService";

describe("legal graph rules", () => {
  it("detects contradictions across payload facts", () => {
    const out = detectContradictions({ payload: { tenant_present: false, lease_details: "Lease active" }, validation: { contradictionFlags: [] }, status: "draft" });
    expect(out.length).toBeGreaterThan(0);
  });

  it("detects missing dependencies", () => {
    const out = detectMissingDependencies({ payload: { tenant_present: true, lease_details: "" }, validation: { missingFields: ["lease_details"] }, signatures: [] });
    expect(out.some((x) => x.issueType === "missing_dependency")).toBe(true);
  });

  it("detects review blockers", () => {
    const out = detectReviewBlockers({ validation: { contradictionFlags: ["x"], missingFields: [] }, status: "approved" });
    expect(out.length).toBeGreaterThan(0);
  });

  it("detects signature blockers", () => {
    const out = detectSignatureBlockers({ validation: { missingFields: ["a"], contradictionFlags: [] }, status: "draft", signatures: [] });
    expect(out.length).toBeGreaterThan(0);
  });

  it("detects workflow inconsistencies", () => {
    const out = detectWorkflowInconsistencies({ status: "draft", signatures: [{ status: "signed" }], validation: { contradictionFlags: [] } });
    expect(out.length).toBeGreaterThan(0);
  });
});
