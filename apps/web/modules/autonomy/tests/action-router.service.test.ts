import { describe, expect, it, vi } from "vitest";
import type { ApplicablePolicy } from "@/modules/autonomy/autonomy-policy.service";
import type { AutonomousActionCandidate } from "@/modules/autonomy/autonomy.types";

const queueCreate = vi.fn();
const execCreate = vi.fn();
const queueUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    autonomousActionQueue: {
      create: (...args: unknown[]) => queueCreate(...args),
      update: (...args: unknown[]) => queueUpdate(...args),
    },
    autonomousExecutionEvent: {
      create: (...args: unknown[]) => execCreate(...args),
    },
  },
}));

const pol = (): ApplicablePolicy => ({
  mode: "APPROVAL_REQUIRED",
  maxRiskLevel: "HIGH",
  allowedActionTypes: new Set(),
  blockedActionTypes: new Set(),
  requireApprovalFor: new Set(),
  emergencyFreeze: false,
  policyId: "t",
  version: 1,
});

const draftCandidate = (): AutonomousActionCandidate => ({
  id: "c1",
  domain: "MESSAGING",
  actionType: "GENERATE_MESSAGE_DRAFT",
  riskLevel: "LOW",
  confidence: 0.6,
  rationale: "test",
  payload: { draft: "hello" },
  requiresApproval: true,
  blockedReasons: [],
  sourceAgent: "test",
  relatedEntityIds: {},
  policyFlags: [],
  createdAt: new Date().toISOString(),
});

describe("action-router.service", () => {
  it("queues draft actions for human approval", async () => {
    queueCreate.mockResolvedValue({ id: "q1" });
    const { routeAutonomousAction } = await import("@/modules/autonomy/action-router.service");
    const r = await routeAutonomousAction(draftCandidate(), { policy: pol(), dryRun: false });
    expect(r.status).toBe("QUEUED");
    expect(queueCreate).toHaveBeenCalled();
  });
});
