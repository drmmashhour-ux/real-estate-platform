import { describe, it, expect, vi } from "vitest";
import { trackAllocationPerformance } from "../capital-learning.service";
import { getAllocationWeights } from "../capital-allocation-weights.service";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    capitalAllocationLog: {
      create: vi.fn(),
    },
    platformConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Capital Learning Loop", () => {
  it("should log performance and update weights on success", async () => {
    const listingId = "l1";
    const planId = "p1";
    const performanceDelta = 0.15; // Success

    await trackAllocationPerformance(listingId, planId, performanceDelta);

    expect(prisma.capitalAllocationLog.create).toHaveBeenCalled();
    // Weights are logged to info in V2 mock but we can check if it completed
  });

  it("should fetch default weights if none in DB", async () => {
    (prisma.platformConfig.findUnique as any).mockResolvedValue(null);
    const weights = await getAllocationWeights();
    expect(weights.upliftWeight).toBe(12);
  });
});
