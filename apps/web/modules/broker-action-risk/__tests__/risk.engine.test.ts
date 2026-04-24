import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    deal: { findUnique: vi.fn() },
    complianceCase: { count: vi.fn() },
    dealDocument: { count: vi.fn() },
    dealClosingCondition: { findMany: vi.fn() },
    crmDealInvestorCommitment: { count: vi.fn() },
    offerDraft: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { assessBrokerApprovalRisk } from "../risk.engine";

beforeEach(() => {
  vi.mocked(prisma.deal.findUnique).mockReset();
  vi.mocked(prisma.complianceCase.count).mockReset();
  vi.mocked(prisma.dealDocument.count).mockReset();
  vi.mocked(prisma.dealClosingCondition.findMany).mockReset();
  vi.mocked(prisma.crmDealInvestorCommitment.count).mockReset();
  vi.mocked(prisma.offerDraft.findFirst).mockReset();

  vi.mocked(prisma.complianceCase.count).mockResolvedValue(0);
  vi.mocked(prisma.dealDocument.count).mockResolvedValue(2);
  vi.mocked(prisma.dealClosingCondition.findMany).mockResolvedValue([]);
  vi.mocked(prisma.crmDealInvestorCommitment.count).mockResolvedValue(0);
});

describe("assessBrokerApprovalRisk", () => {
  it("returns HIGH with blockers on conflict disclosure", async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({
      id: "d1",
      status: "CONFLICT_REQUIRES_DISCLOSURE",
      priceCents: 500_000_00,
      listingId: "l1",
      riskLevel: "LOW",
      possibleBypassFlag: false,
      qaReviews: [],
    } as never);

    const r = await assessBrokerApprovalRisk({ kind: "signature_session", dealId: "d1" });
    expect(r.riskLevel).toBe("HIGH");
    expect(r.blockers.length).toBeGreaterThan(0);
  });

  it("flags abnormal pricing on offer draft approve", async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({
      id: "d1",
      status: "initiated",
      priceCents: 100_000_00,
      listingId: "l1",
      riskLevel: "LOW",
      possibleBypassFlag: false,
      qaReviews: [],
    } as never);
    vi.mocked(prisma.offerDraft.findFirst).mockResolvedValue({
      purchasePrice: 500_000,
      clauseWarningsJson: [],
      financingClauseText: "x".repeat(40),
      inspectionClauseText: "y".repeat(40),
    } as never);

    const r = await assessBrokerApprovalRisk({
      kind: "offer_draft_approve",
      dealId: "d1",
      draftId: "od1",
    });
    expect(r.flags.some((f) => f.type === "abnormal_pricing")).toBe(true);
    expect(r.blockers.length).toBeGreaterThan(0);
  });
});
