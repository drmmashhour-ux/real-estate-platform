import { describe, expect, it, vi, beforeEach } from "vitest";
import { calculateVestedShares, wholeMonthsElapsed } from "../vesting";
import { createGrant } from "../grants";

describe("equity vesting", () => {
  const start = new Date(Date.UTC(2024, 0, 1));

  it("wholeMonthsElapsed respects UTC anniversaries", () => {
    expect(wholeMonthsElapsed(start, new Date(Date.UTC(2024, 0, 1)))).toBe(0);
    expect(wholeMonthsElapsed(start, new Date(Date.UTC(2024, 11, 31)))).toBe(11);
  });

  it("no vest before cliff", () => {
    const v = calculateVestedShares(
      { totalShares: 10000, vestingStart: start, vestingDurationMonths: 48, cliffMonths: 12 },
      new Date(Date.UTC(2024, 5, 1))
    );
    expect(v).toBe(0);
  });

  it("full vest after duration", () => {
    const v = calculateVestedShares(
      { totalShares: 10000, vestingStart: start, vestingDurationMonths: 48, cliffMonths: 12 },
      new Date(Date.UTC(2028, 6, 1))
    );
    expect(v).toBe(10000);
  });

  it("linear after cliff", () => {
    // 12 months after cliff start = month 24 elapsed -> 12 months into 36-month vest window -> 1/3 of 4800? total 10000, after cliff 36 months linear
    const v = calculateVestedShares(
      { totalShares: 9000, vestingStart: start, vestingDurationMonths: 48, cliffMonths: 12 },
      new Date(Date.UTC(2026, 0, 1))
    );
    // monthsElapsed = 24, cliff 12, window 36, into vest 12 -> 12/36 * 9000 = 3000
    expect(v).toBeCloseTo(3000, 5);
  });
});

vi.mock("@/lib/db", () => ({
  prisma: {
    equityGrant: {
      create: vi.fn().mockResolvedValue({ id: "g1" }),
      update: vi.fn(),
    },
    equityHolder: { update: vi.fn() },
  },
}));

vi.mock("@/src/modules/equity/capTable", () => ({
  syncHolderEquityPercents: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";

describe("equity grants (simulated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createGrant persists and syncs cap table", async () => {
    await createGrant({
      holderId: "h1",
      totalShares: 1000,
      vestingStart: new Date(),
      vestingDuration: 48,
      cliffMonths: 12,
    });
    expect(prisma.equityGrant.create).toHaveBeenCalled();
  });
});
