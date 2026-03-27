import { describe, expect, it } from "vitest";
import { evaluateWorkflowNextSteps } from "@/src/modules/autonomous-workflow-assistant/application/evaluateWorkflowNextSteps";

describe("evaluateWorkflowNextSteps", () => {
  it("creates checklist when fields missing", () => {
    const steps = evaluateWorkflowNextSteps({
      documentId: "d1",
      status: "draft",
      draftPayload: {},
      blockingIssues: [],
    });
    expect(steps.some((s) => s.taskType === "checklist_missing_items")).toBe(true);
  });

  it("recommends route_needs_changes when status is needs_changes", () => {
    const steps = evaluateWorkflowNextSteps({
      documentId: "d1",
      status: "needs_changes" as any,
      draftPayload: {},
      blockingIssues: [],
      graphFileHealth: "warning",
    });
    expect(steps.some((s) => s.taskType === "route_needs_changes")).toBe(true);
  });

  it("adds escalation recommendation when thresholds met", () => {
    const steps = evaluateWorkflowNextSteps({
      documentId: "d1",
      status: "draft",
      draftPayload: {},
      blockingIssues: ["a", "b"],
      criticalGraphIssueCount: 1,
    });
    expect(steps.some((s) => s.taskType === "escalation_recommendation")).toBe(true);
  });

  it("includes sourceRefs on checklist tasks", () => {
    const steps = evaluateWorkflowNextSteps({
      documentId: "d1",
      status: "draft",
      draftPayload: {},
      blockingIssues: [],
    });
    const checklist = steps.find((s) => s.taskType === "checklist_missing_items");
    expect(checklist?.sourceRefs?.length).toBeGreaterThan(0);
  });
});
