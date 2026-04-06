import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    fundraisingInvestor: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    fundraisingInvestorInteraction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    fundraisingDeal: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { createDeal, createInvestor, logInteraction, updateDealStatus, updateStage } from "../pipeline";
import { logOutreachMessage, trackFollowUp, trackResponse } from "../outreach";

describe("fundraising pipeline (simulated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createInvestor persists validated row", async () => {
    vi.mocked(prisma.fundraisingInvestor.create).mockResolvedValue({
      id: "inv-1",
      name: "Pat",
      email: "pat@vc.com",
      firm: "VC",
      stage: "contacted",
      notes: null,
      nextFollowUpAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const row = await createInvestor({ name: "Pat", email: "pat@vc.com", firm: "VC" });
    expect(row.id).toBe("inv-1");
    expect(prisma.fundraisingInvestor.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: "pat@vc.com", stage: "contacted" }),
      })
    );
  });

  it("logInteraction records touchpoint", async () => {
    vi.mocked(prisma.fundraisingInvestorInteraction.create).mockResolvedValue({
      id: "int-1",
      investorId: "inv-1",
      type: "email",
      summary: "Hello",
      createdAt: new Date(),
    } as never);

    await logInteraction("inv-1", "email", "Hello");
    expect(prisma.fundraisingInvestorInteraction.create).toHaveBeenCalledWith({
      data: { investorId: "inv-1", type: "email", summary: "Hello" },
    });
  });

  it("updateDealStatus changes deal", async () => {
    vi.mocked(prisma.fundraisingDeal.update).mockResolvedValue({
      id: "deal-1",
      investorId: "inv-1",
      amount: 1e6,
      status: "committed",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await updateDealStatus("deal-1", "committed");
    expect(prisma.fundraisingDeal.update).toHaveBeenCalledWith({
      where: { id: "deal-1" },
      data: { status: "committed" },
    });
  });

  it("updateStage moves investor", async () => {
    vi.mocked(prisma.fundraisingInvestor.update).mockResolvedValue({} as never);
    await updateStage("inv-1", "meeting");
    expect(prisma.fundraisingInvestor.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { stage: "meeting" },
    });
  });

  it("outreach helpers use interaction types", async () => {
    vi.mocked(prisma.fundraisingInvestorInteraction.create).mockResolvedValue({} as never);
    vi.mocked(prisma.fundraisingInvestor.update).mockResolvedValue({} as never);

    await logOutreachMessage("i1", "cold email");
    expect(prisma.fundraisingInvestorInteraction.create).toHaveBeenCalledWith({
      data: { investorId: "i1", type: "outreach", summary: "cold email" },
    });

    await trackResponse("i1", "they replied");
    expect(prisma.fundraisingInvestorInteraction.create).toHaveBeenCalledWith({
      data: { investorId: "i1", type: "response", summary: "they replied" },
    });

    const fu = new Date("2026-04-01T15:00:00.000Z");
    await trackFollowUp("i1", "schedule call", fu);
    expect(prisma.fundraisingInvestor.update).toHaveBeenCalledWith({
      where: { id: "i1" },
      data: { nextFollowUpAt: fu },
    });
  });

  it("createDeal validates amount", async () => {
    await expect(createDeal("i1", -1)).rejects.toThrow();
  });
});
