import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    deal: { findUnique: vi.fn() },
    offerDraft: { findFirst: vi.fn() },
    lecipmLegalDocumentArtifact: { findFirst: vi.fn() },
    negotiationThread: { count: vi.fn() },
    dealClosingCondition: { findMany: vi.fn() },
    dealNotaryCoordination: { findUnique: vi.fn() },
    platformPayment: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { computeDealPlaybookView } from "../deal-playbook-engine.service";

const baseDeal = {
  status: "initiated",
  crmStage: "new",
  leadId: "lead-1",
  listingId: null as string | null,
  closeProbability: null as number | null,
  riskLevel: null as string | null,
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.mocked(prisma.deal.findUnique).mockReset();
  vi.mocked(prisma.offerDraft.findFirst).mockReset();
  vi.mocked(prisma.lecipmLegalDocumentArtifact.findFirst).mockReset();
  vi.mocked(prisma.negotiationThread.count).mockReset();
  vi.mocked(prisma.dealClosingCondition.findMany).mockReset();
  vi.mocked(prisma.dealNotaryCoordination.findUnique).mockReset();
  vi.mocked(prisma.platformPayment.count).mockReset();

  vi.mocked(prisma.negotiationThread.count).mockResolvedValue(0);
  vi.mocked(prisma.dealClosingCondition.findMany).mockResolvedValue([]);
  vi.mocked(prisma.dealNotaryCoordination.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.platformPayment.count).mockResolvedValue(0);
  vi.mocked(prisma.lecipmLegalDocumentArtifact.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.offerDraft.findFirst).mockResolvedValue(null);
});

describe("computeDealPlaybookView", () => {
  it("returns null when deal is missing", async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue(null);
    await expect(computeDealPlaybookView("missing")).resolves.toBeNull();
  });

  it("places current step at property_selection when lead exists but no listing", async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({ ...baseDeal } as never);
    const v = await computeDealPlaybookView("d1");
    expect(v).not.toBeNull();
    expect(v!.completedSteps).toContain("lead_intake");
    expect(v!.currentStep).toBe("property_selection");
    expect(v!.progressPercent).toBe(10);
  });

  it("advances to offer_generation_ai when listing is linked and advances with draft", async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({
      ...baseDeal,
      listingId: "lst-1",
    } as never);
    let v = await computeDealPlaybookView("d1");
    expect(v!.currentStep).toBe("offer_generation_ai");

    vi.mocked(prisma.offerDraft.findFirst).mockResolvedValue({ status: "DRAFT" } as never);
    v = await computeDealPlaybookView("d1");
    expect(v!.completedSteps).toContain("offer_generation_ai");
    expect(v!.currentStep).toBe("broker_review_signature");
  });

  it("flags overdue conditions in risk and delays", async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({
      ...baseDeal,
      listingId: "lst-1",
      status: "financing",
    } as never);
    vi.mocked(prisma.offerDraft.findFirst).mockResolvedValue({ status: "SENT" } as never);
    vi.mocked(prisma.negotiationThread.count).mockResolvedValue(1);
    vi.mocked(prisma.dealClosingCondition.findMany).mockResolvedValue([
      { deadline: new Date(Date.now() - 86_400_000), status: "pending", fulfilledAt: null },
    ] as never);

    const v = await computeDealPlaybookView("d1");
    expect(v!.riskFlags.some((x) => /overdue/i.test(x))).toBe(true);
    expect(v!.delays.length).toBeGreaterThan(0);
  });
});
