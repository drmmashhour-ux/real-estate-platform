import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    opsAssistantApprovalFlags: {
      opsAssistantApprovalExecutionV1: true,
      opsAssistantApprovalPanelV1: true,
      opsAssistantApprovalKillSwitch: false,
    },
  };
});

import { enrichPlatformImprovementPriority } from "../../platform-improvement-priority-meta.service";
import {
  resetPlatformImprovementStateForTests,
  syncExecutionStateWithBundle,
} from "../../platform-improvement-state.service";
import { mergeTestPlatformReviewSnapshot } from "../../platform-review-snapshot";
import { buildFullPlatformImprovementBundle } from "../../platform-improvement-review.service";
import {
  approveExecutionRequest,
  createApprovalExecutionRequest,
  denyExecutionRequest,
  executeApprovedRequest,
  resetApprovalExecutionForTests,
  undoExecutionRequest,
} from "../approval-execution.service";
import { getApprovalMonitoringSnapshot } from "../approval-execution-monitoring.service";
import { buildOpsSuggestions } from "../ops-assistant.service";

describe("approval-execution.service", () => {
  beforeEach(() => {
    resetApprovalExecutionForTests();
    resetPlatformImprovementStateForTests();
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("only creates requests for executable suggestions rebuilt on the server", () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const p = bundle.priorities[0]!;
    const sug = buildOpsSuggestions(p, { currentStatus: "new" }).find((x) => x.executable);
    expect(sug?.executable?.actionType).toBeTruthy();
    const created = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: sug!.id,
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(created.ok).toBe(true);
    const bad = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: "__no_such_suggestion__",
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(bad.ok).toBe(false);
  });

  it("approval required before execution (pending cannot execute)", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const p = bundle.priorities[0]!;
    const sug = buildOpsSuggestions(p, { currentStatus: "new" }).find((x) => x.executable)!;
    const created = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: sug.id,
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(created.ok).toBe(true);
    const execEarly = await executeApprovedRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(execEarly.ok).toBe(false);
    const approved = approveExecutionRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(approved.ok).toBe(true);
    const exec = await executeApprovedRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(exec.ok).toBe(true);
    expect(exec.result.success).toBe(true);
  });

  it("deny path resolves pending", () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const p = bundle.priorities[0]!;
    const sug = buildOpsSuggestions(p, { currentStatus: "new" }).find((x) => x.executable)!;
    const created = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: sug.id,
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(created.ok).toBe(true);
    const denied = denyExecutionRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(denied.ok).toBe(true);
    expect(denied.request.status).toBe("denied");
  });

  it("blocks duplicate pending approval for same suggestion", () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const p = bundle.priorities[0]!;
    const sug = buildOpsSuggestions(p, { currentStatus: "new" }).find((x) => x.executable)!;
    const a = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: sug.id,
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(a.ok).toBe(true);
    const b = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: sug.id,
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(b.ok).toBe(false);
  });

  it("kill switch blocks creation", () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const p = bundle.priorities[0]!;
    const sug = buildOpsSuggestions(p, { currentStatus: "new" }).find((x) => x.executable)!;
    const blocked = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: sug.id,
      priorities: bundle.priorities,
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: true, executionFlagOn: true },
    });
    expect(blocked.ok).toBe(false);
    expect(getApprovalMonitoringSnapshot().blockedBySafety).toBeGreaterThanOrEqual(1);
  });

  it("undo works for reversible draft execution", async () => {
    const bundle = buildFullPlatformImprovementBundle(mergeTestPlatformReviewSnapshot({}));
    syncExecutionStateWithBundle(bundle);
    const p = enrichPlatformImprovementPriority({
      title: "Clarify primary CTA on key surfaces",
      why: "Hero competes with secondary actions.",
      expectedImpact: "Better conversion",
      category: "conversion",
      urgency: "medium",
    });
    const list = buildOpsSuggestions(p, { currentStatus: "new" });
    const draftSug = list.find((x) => x.executable?.actionType === "createInternalDraft");
    expect(draftSug).toBeTruthy();
    const created = createApprovalExecutionRequest({
      priorityId: p.id,
      suggestionId: draftSug!.id,
      priorities: [p],
      statusByPriorityId: { [p.id]: "new" },
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(created.ok).toBe(true);
    approveExecutionRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    const ran = await executeApprovedRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(ran.result.success).toBe(true);
    const undone = await undoExecutionRequest({
      requestId: created.request.id,
      safety: { killSwitchActive: false, executionFlagOn: true },
    });
    expect(undone.ok).toBe(true);
    expect(undone.result.success).toBe(true);
  });
});
