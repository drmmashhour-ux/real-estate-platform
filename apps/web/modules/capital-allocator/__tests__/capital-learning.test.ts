import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackAllocationPerformance } from "../capital-learning.service";
import { getAllocationWeights } from "../capital-allocation-weights.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    capitalAllocationLog: {
      create: vi.fn(),
    },
    autonomyRuleWeight: {
      upsert: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("Capital Allocator Learning Loop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log performance and update weights on success", async () => {
    await trackAllocationPerformance({
      listingId: "l1",
      planId: "p1",
      performanceDelta: 0.15,
      metricType: "revenue",
    });

    expect(prisma.capitalAllocationLog.create).toHaveBeenCalled();
    expect(prisma.autonomyRuleWeight.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ signalKey: "upliftWeight", weight: 14 }),
      })
    );
  });

  it("should increase risk penalty on poor performance", async () => {
    await trackAllocationPerformance({
      listingId: "l2",
      planId: "p2",
      performanceDelta: -0.1,
      metricType: "occupancy",
    });

    expect(prisma.autonomyRuleWeight.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ signalKey: "riskPenalty", weight: 30 }),
      })
    );
  });

  it("should fetch default weights if none in DB", async () => {
    (prisma.autonomyRuleWeight.findMany as any).mockResolvedValue([]);
    const weights = await getAllocationWeights();
    expect(weights.upliftWeight).toBe(12);
  });
});
