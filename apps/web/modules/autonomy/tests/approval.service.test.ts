import { describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const createEvent = vi.fn();
const updateQueue = vi.fn();
const createExec = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    autonomousActionQueue: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => updateQueue(...a),
    },
    autonomousApprovalEvent: {
      create: (...a: unknown[]) => createEvent(...a),
    },
    autonomousExecutionEvent: {
      create: (...a: unknown[]) => createExec(...a),
    },
  },
}));

describe("approval.service", () => {
  it("approve updates status without throwing", async () => {
    findUnique.mockResolvedValueOnce({ id: "q1", status: "QUEUED" });
    updateQueue.mockResolvedValue({});
    createEvent.mockResolvedValue({});

    const { approveAutonomousAction } = await import("@/modules/autonomy/approval.service");
    const r = await approveAutonomousAction("q1", "u1", "ok");
    expect(r.ok).toBe(true);
  });
});
