import { describe, expect, it } from "vitest";
import { resolveTaskPriority } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskPriorityService";
import { computeTaskFingerprint, shouldSkipDuplicateTaskCreation, pendingTaskHasFingerprint } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskDeduplicationService";
import { findPendingTaskIdsToAutoComplete } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskResolutionService";
import { groupTasksForDisplay, sortTasksByPriorityThenAge } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskGroupingService";

describe("taskPriorityService", () => {
  it("maps contradiction and escalation to critical", () => {
    expect(resolveTaskPriority("contradiction")).toBe("critical");
    expect(resolveTaskPriority("escalation")).toBe("critical");
  });

  it("maps mandatory disclosure and missing fields to high", () => {
    expect(resolveTaskPriority("mandatory_disclosure")).toBe("high");
    expect(resolveTaskPriority("missing_mandatory_fields")).toBe("high");
  });

  it("maps case summary to low", () => {
    expect(resolveTaskPriority("case_summary")).toBe("low");
  });
});

describe("taskDeduplicationService", () => {
  it("builds stable fingerprints", () => {
    expect(computeTaskFingerprint("a", ["z", "b"])).toBe(computeTaskFingerprint("a", ["b", "z"]));
    expect(computeTaskFingerprint("a", ["b"])).not.toBe(computeTaskFingerprint("a", ["c"]));
  });

  it("detects pending fingerprint collision", () => {
    expect(pendingTaskHasFingerprint([{ payload: { fingerprint: "x::" } }], "x::")).toBe(true);
    expect(pendingTaskHasFingerprint([{ payload: {} }], "x::")).toBe(false);
  });

  it("skips duplicate when pending already has fingerprint", () => {
    expect(
      shouldSkipDuplicateTaskCreation({
        fingerprint: "t::",
        pendingFingerprints: new Set(["t::"]),
        lastCreatedAtForFingerprint: null,
        nowMs: Date.now(),
      }),
    ).toBe(true);
  });

  it("skips when cooldown not elapsed", () => {
    const now = Date.now();
    expect(
      shouldSkipDuplicateTaskCreation({
        fingerprint: "t::",
        pendingFingerprints: new Set(),
        lastCreatedAtForFingerprint: new Date(now - 30_000),
        nowMs: now,
        cooldownMs: 120_000,
      }),
    ).toBe(true);
  });
});

describe("taskResolutionService", () => {
  it("auto-completes missing-field tasks when keys cleared", () => {
    const ids = findPendingTaskIdsToAutoComplete(
      [
        {
          id: "1",
          status: "pending",
          payload: { resolutionCheck: { kind: "missing_fields", keys: ["a"] } },
        },
      ],
      { missingFields: [], blockingIssues: [], contradictions: [], knowledgeRuleBlocks: [] },
    );
    expect(ids).toContain("1");
  });

  it("does not auto-complete without resolutionCheck", () => {
    const ids = findPendingTaskIdsToAutoComplete(
      [{ id: "1", status: "pending", payload: {} }],
      { missingFields: [], blockingIssues: [], contradictions: [], knowledgeRuleBlocks: [] },
    );
    expect(ids.length).toBe(0);
  });
});

describe("taskGroupingService", () => {
  it("sorts by priority then age", () => {
    const sorted = sortTasksByPriorityThenAge([
      { id: "l", taskType: "x", priority: "low", summary: "", status: "pending", requiresApproval: false, createdAt: new Date(100) },
      { id: "c", taskType: "x", priority: "critical", summary: "", status: "pending", requiresApproval: false, createdAt: new Date(200) },
    ] as any);
    expect(sorted[0].id).toBe("c");
  });

  it("groups multiple reviewer drafts", () => {
    const { groups, standalone } = groupTasksForDisplay([
      { id: "1", taskType: "reviewer_comment_draft", priority: "medium", summary: "a", status: "pending", requiresApproval: false },
      { id: "2", taskType: "reviewer_comment_draft", priority: "medium", summary: "b", status: "pending", requiresApproval: false },
      { id: "3", taskType: "route_to_review", priority: "medium", summary: "c", status: "pending", requiresApproval: false },
    ] as any);
    expect(groups.length).toBe(1);
    expect(groups[0].tasks.length).toBe(2);
    expect(standalone.some((t) => t.id === "3")).toBe(true);
  });
});
