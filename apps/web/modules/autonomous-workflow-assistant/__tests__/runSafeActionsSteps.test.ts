import { describe, expect, it, vi } from "vitest";
import { runSafeWorkflowAutomations } from "@/src/modules/autonomous-workflow-assistant/application/runSafeWorkflowAutomations";

vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));

vi.mock("@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository", () => ({
  listWorkflowTasks: vi.fn(),
  createWorkflowTask: vi.fn(),
  recordWorkflowAutomationEvent: vi.fn(),
  bulkCompleteTasks: vi.fn(),
  findLatestCreatedAtForFingerprint: vi.fn(),
}));

import {
  listWorkflowTasks,
  createWorkflowTask,
  recordWorkflowAutomationEvent,
  bulkCompleteTasks,
  findLatestCreatedAtForFingerprint,
} from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository";

describe("runSafeWorkflowAutomations (steps mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates only safe tasks and blocks restricted tasks", async () => {
    vi.mocked(listWorkflowTasks).mockResolvedValue([] as any);
    vi.mocked(createWorkflowTask).mockResolvedValue({ id: "t1" } as any);
    vi.mocked(recordWorkflowAutomationEvent).mockResolvedValue({} as any);
    vi.mocked(bulkCompleteTasks).mockResolvedValue({ count: 0 } as any);
    vi.mocked(findLatestCreatedAtForFingerprint).mockResolvedValue(null);

    const steps = [
      {
        taskType: "route_to_review",
        priority: "medium",
        targetUserRole: "reviewer",
        summary: "ok",
        recommendedAction: "assign reviewer",
        confidence: 0.6,
        requiresApproval: false,
      },
      {
        taskType: "finalize_document",
        priority: "high",
        targetUserRole: "admin",
        summary: "restricted",
        recommendedAction: "should be blocked",
        confidence: 0.1,
        requiresApproval: true,
      },
    ];

    const out = await runSafeWorkflowAutomations({
      documentId: "d1",
      actorUserId: "u1",
      triggerType: "document_updated" as any,
      steps: steps as any,
    });

    expect(vi.mocked(createWorkflowTask).mock.calls.length).toBe(2);
    const taskTypes = vi.mocked(createWorkflowTask).mock.calls.map((c) => c[0].taskType);
    expect(taskTypes).toContain("route_to_review");
    expect(taskTypes).toContain("finalize_document");
    expect(out.results.some((r: any) => r.status === "requires_approval")).toBe(true);
    expect(vi.mocked(recordWorkflowAutomationEvent).mock.calls.some((c) => c[0].status === "pending")).toBe(true);
  });

  it("skips creation when pending task already exists", async () => {
    vi.mocked(listWorkflowTasks).mockResolvedValue([
      { taskType: "route_to_review", payload: { fingerprint: "route_to_review::" } },
    ] as any);
    vi.mocked(createWorkflowTask).mockResolvedValue({} as any);
    vi.mocked(recordWorkflowAutomationEvent).mockResolvedValue({} as any);
    vi.mocked(bulkCompleteTasks).mockResolvedValue({ count: 0 } as any);
    vi.mocked(findLatestCreatedAtForFingerprint).mockResolvedValue(null);

    const out = await runSafeWorkflowAutomations({
      documentId: "d1",
      actorUserId: "u1",
      triggerType: "document_updated" as any,
      steps: [
        {
          taskType: "route_to_review",
          priority: "medium",
          targetUserRole: "reviewer",
          summary: "ok",
          recommendedAction: "assign reviewer",
          confidence: 0.6,
          requiresApproval: false,
        },
      ] as any,
    });

    expect(vi.mocked(createWorkflowTask).mock.calls.length).toBe(0);
    expect(out.results[0].status).toBe("skipped_duplicate_or_cooldown");
  });
});
