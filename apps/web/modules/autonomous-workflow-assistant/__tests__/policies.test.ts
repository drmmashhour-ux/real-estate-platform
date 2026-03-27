import { describe, expect, it } from "vitest";
import { isSafeAutomationAction } from "@/src/modules/autonomous-workflow-assistant/policies/safeActionsPolicy";
import { requiresHumanApproval, resolveTaskApprovalFlags, isRestrictedTaskType } from "@/src/modules/autonomous-workflow-assistant/policies/approvalRequiredPolicy";
import { evaluateActionPolicy } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowActionPolicyService";

describe("autonomous workflow policies", () => {
  it("allows safe draft comment automation", () => {
    expect(isSafeAutomationAction("draft_internal_comment")).toBe(true);
  });

  it("blocks finalize without approval", () => {
    expect(requiresHumanApproval("finalize_document")).toBe(true);
    expect(evaluateActionPolicy("finalize_document").mayAutoExecute).toBe(false);
  });

  it("forces requiresApproval on restricted task types", () => {
    expect(isRestrictedTaskType("finalize_document")).toBe(true);
    const r = resolveTaskApprovalFlags({
      taskType: "finalize_document",
      requiresApproval: false,
    } as any);
    expect(r.requiresApproval).toBe(true);
  });
});
