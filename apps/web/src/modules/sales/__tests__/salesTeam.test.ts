import { describe, expect, it, vi, beforeEach } from "vitest";
import { assignmentConversionRate } from "../performance";
import { pickNextAgentId } from "../distribution";

vi.mock("@/lib/db", () => ({
  prisma: {
    salesAgent: { findMany: vi.fn() },
    salesAssignment: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";

describe("sales performance helpers", () => {
  it("assignmentConversionRate", () => {
    expect(assignmentConversionRate(10, 2)).toBe(0.2);
    expect(assignmentConversionRate(0, 5)).toBe(0);
  });
});

describe("sales distribution (simulated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pickNextAgentId round_robin chooses lowest load", async () => {
    vi.mocked(prisma.salesAgent.findMany).mockResolvedValue([
      { id: "a1", userId: "u1", role: "agent", active: true, priority: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: "a2", userId: "u2", role: "agent", active: true, priority: 0, createdAt: new Date(), updatedAt: new Date() },
    ] as never);
    vi.mocked(prisma.salesAssignment.count)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);

    const id = await pickNextAgentId("round_robin");
    expect(id).toBe("a2");
  });

  it("pickNextAgentId priority prefers higher weight", async () => {
    vi.mocked(prisma.salesAgent.findMany).mockResolvedValue([
      { id: "low", userId: "u1", role: "agent", active: true, priority: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: "high", userId: "u2", role: "agent", active: true, priority: 10, createdAt: new Date(), updatedAt: new Date() },
    ] as never);
    vi.mocked(prisma.salesAssignment.count).mockResolvedValue(0);

    const id = await pickNextAgentId("priority");
    expect(id).toBe("high");
  });
});
