import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    investorCommitment: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    fundraisingRound: {
      update: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  commitmentStatusCountsTowardRaised,
  computeRaisedFromCommitments,
  roundProgressPercent,
  roundRemaining,
} from "../roundMetrics";
import {
  createInvestorCommitment,
  syncRoundRaisedAmount,
  updateInvestorCommitment,
} from "../round";

describe("roundMetrics", () => {
  it("computeRaisedFromCommitments sums partial, committed, transferred (excludes verbal/interested)", () => {
    expect(
      computeRaisedFromCommitments([
        { amount: 8_000, status: "verbal" },
        { amount: 10_000, status: "interested" },
        { amount: 7_000, status: "partial" },
        { amount: 25_000, status: "committed" },
        { amount: 15_000, status: "transferred" },
      ]),
    ).toBe(47_000);
  });

  it("roundProgressPercent caps at 100", () => {
    expect(roundProgressPercent(100_000, 50_000)).toBe(50);
    expect(roundProgressPercent(100_000, 150_000)).toBe(100);
  });

  it("roundRemaining never negative", () => {
    expect(roundRemaining(100_000, 30_000)).toBe(70_000);
    expect(roundRemaining(100_000, 120_000)).toBe(0);
  });

  it("commitmentStatusCountsTowardRaised", () => {
    expect(commitmentStatusCountsTowardRaised("verbal")).toBe(false);
    expect(commitmentStatusCountsTowardRaised("interested")).toBe(false);
    expect(commitmentStatusCountsTowardRaised("partial")).toBe(true);
    expect(commitmentStatusCountsTowardRaised("committed")).toBe(true);
    expect(commitmentStatusCountsTowardRaised("transferred")).toBe(true);
  });
});

describe("fundraising round (simulated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncRoundRaisedAmount aggregates and updates round", async () => {
    vi.mocked(prisma.investorCommitment.findMany).mockResolvedValue([
      { amount: 20_000, status: "committed" },
      { amount: 5_000, status: "interested" },
    ] as never);
    vi.mocked(prisma.fundraisingRound.update).mockResolvedValue({} as never);

    const raised = await syncRoundRaisedAmount("round-1");
    expect(raised).toBe(20_000);
    expect(prisma.fundraisingRound.update).toHaveBeenCalledWith({
      where: { id: "round-1" },
      data: { raisedAmount: 20_000 },
    });
  });

  it("createInvestorCommitment creates row and syncs round", async () => {
    vi.mocked(prisma.investorCommitment.create).mockResolvedValue({
      id: "c1",
      roundId: "r1",
      investorId: "i1",
      amount: 10_000,
      status: "committed",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.investorCommitment.findMany).mockResolvedValue([
      { amount: 10_000, status: "committed" },
    ] as never);
    vi.mocked(prisma.fundraisingRound.update).mockResolvedValue({} as never);

    const row = await createInvestorCommitment("r1", "i1", 10_000, "committed");
    expect(row.id).toBe("c1");
    expect(prisma.investorCommitment.create).toHaveBeenCalled();
    expect(prisma.fundraisingRound.update).toHaveBeenCalled();
  });

  it("updateInvestorCommitment updates and syncs", async () => {
    vi.mocked(prisma.investorCommitment.findUnique).mockResolvedValue({
      roundId: "r1",
    } as never);
    vi.mocked(prisma.investorCommitment.update).mockResolvedValue({
      id: "c1",
      roundId: "r1",
      investorId: "i1",
      amount: 12_000,
      status: "transferred",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.investorCommitment.findMany).mockResolvedValue([
      { amount: 12_000, status: "transferred" },
    ] as never);
    vi.mocked(prisma.fundraisingRound.update).mockResolvedValue({} as never);

    await updateInvestorCommitment("c1", { status: "transferred", amount: 12_000 });
    expect(prisma.investorCommitment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "c1" },
        data: expect.objectContaining({ status: "transferred", amount: 12_000 }),
      }),
    );
  });
});
