import { describe, it, expect, vi, beforeEach } from "vitest";
import { listPendingApprovals } from "../services/autonomy-approval-inbox.service";
import { performRollback } from "../actions/autonomy-rollback.service";
import { toggleDomainKillSwitch, getDomainKillSwitches } from "../services/autonomy-kill-switch.service";
import { getAutonomyModeRecommendation } from "../services/autonomy-mode-recommendation.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    autonomousActionQueue: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    autonomyExecutionAuditLog: {
      create: vi.fn(),
    },
    managerAiAutonomyGovernanceState: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/modules/autonomy/autonomy-log", () => ({
  autonomyLog: {
    actionExecuted: vi.fn(),
  },
}));

describe("Autonomy Operations Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Approval Inbox", () => {
    it("should list pending approvals", async () => {
      const mockPending = [
        {
          id: "1",
          domain: "pricing",
          actionType: "ADJUST_PRICE",
          entityType: "listing",
          entityId: "l1",
          riskLevel: "MEDIUM",
          candidateJson: { price: 100 },
          rationale: "market trend",
          createdAt: new Date(),
        },
      ];
      (prisma.autonomousActionQueue.findMany as any).mockResolvedValue(mockPending);

      const result = await listPendingApprovals();
      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe("pricing");
      expect(prisma.autonomousActionQueue.findMany).toHaveBeenCalled();
    });
  });

  describe("Rollback", () => {
    it("should perform rollback for safe actions", async () => {
      const mockAction = {
        id: "a1",
        status: "EXECUTED",
        actionType: "ADJUST_PRICE",
        candidateJson: { price: 100 },
        domain: "pricing",
      };
      (prisma.autonomousActionQueue.findUnique as any).mockResolvedValue(mockAction);
      (prisma.autonomousActionQueue.update as any).mockResolvedValue({ ...mockAction, status: "ROLLED_BACK" });
      (prisma.autonomyExecutionAuditLog.create as any).mockResolvedValue({});
      (prisma.managerAiAutonomyGovernanceState.update as any).mockResolvedValue({});

      const result = await performRollback("a1", "u1", "mistake");
      expect(result.ok).toBe(true);
      expect(prisma.autonomousActionQueue.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { status: "ROLLED_BACK" },
      });
    });

    it("should fail rollback if action not found", async () => {
      (prisma.autonomousActionQueue.findUnique as any).mockResolvedValue(null);
      const result = await performRollback("none", "u1", "reason");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("action_not_found_or_not_executed");
    });
  });

  describe("Kill Switches", () => {
    it("should toggle domain kill switch", async () => {
      (prisma.managerAiAutonomyGovernanceState.findUnique as any).mockResolvedValue({
        id: "singleton",
        activeDomainsJson: {},
      });
      (prisma.managerAiAutonomyGovernanceState.upsert as any).mockResolvedValue({});

      const result = await toggleDomainKillSwitch("pricing", false, "u1", "unstable");
      expect(result.ok).toBe(true);
      expect(prisma.managerAiAutonomyGovernanceState.upsert).toHaveBeenCalled();
    });

    it("should return default statuses if no gov state exists", async () => {
      (prisma.managerAiAutonomyGovernanceState.findUnique as any).mockResolvedValue(null);
      const result = await getDomainKillSwitches();
      expect(result).toHaveLength(6);
      expect(result.every(d => d.isEnabled)).toBe(true);
    });
  });

  describe("Mode Recommendation", () => {
    it("should recommend ASSIST mode when data is sparse", async () => {
      (prisma.autonomousActionQueue.findMany as any).mockResolvedValue([]);
      (prisma.managerAiAutonomyGovernanceState.findUnique as any).mockResolvedValue(null);

      const result = await getAutonomyModeRecommendation();
      expect(result.suggestedMode).toBe("ASSIST");
    });

    it("should recommend OFF if failure rate is high", async () => {
      const mockActions = Array(10).fill({ status: "BLOCKED", riskLevel: "LOW" });
      (prisma.autonomousActionQueue.findMany as any).mockResolvedValue(mockActions);

      const result = await getAutonomyModeRecommendation();
      expect(result.suggestedMode).toBe("OFF");
    });
  });
});
