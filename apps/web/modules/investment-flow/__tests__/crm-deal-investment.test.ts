import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseInvestmentTargetCents, getCapitalSummaryForDeal } from "../crm-deal-investment.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    crmDealInvestorCommitment: { findMany: vi.fn() },
    deal: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";

describe("parseInvestmentTargetCents", () => {
  it("reads investmentTargetCents from execution metadata", () => {
    expect(parseInvestmentTargetCents({ executionMetadata: { investmentTargetCents: 5_000_000 } })).toBe(5_000_000);
    expect(parseInvestmentTargetCents({ executionMetadata: {} })).toBeNull();
  });
});

describe("getCapitalSummaryForDeal", () => {
  beforeEach(() => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({
      executionMetadata: { investmentTargetCents: 10_000_000 },
    } as never);
  });

  it("aggregates soft, confirmed, and received", async () => {
    vi.mocked(prisma.crmDealInvestorCommitment.findMany).mockResolvedValue([
      {
        status: "SOFT_COMMIT",
        committedAmountCents: 1_000_000,
        subscription: null,
      },
      {
        status: "CONFIRMED",
        committedAmountCents: 2_000_000,
        subscription: {
          payments: [{ received: true, amountCents: 500_000 }, { received: false, amountCents: 100 }],
        },
      },
    ] as never);

    const s = await getCapitalSummaryForDeal("deal-1");
    expect(s.softCommitCents).toBe(1_000_000);
    expect(s.confirmedCommitCents).toBe(2_000_000);
    expect(s.committedCapitalCents).toBe(3_000_000);
    expect(s.receivedCapitalCents).toBe(500_000);
    expect(s.investmentTargetCents).toBe(10_000_000);
    expect(s.remainingGapCents).toBe(9_500_000);
  });
});
