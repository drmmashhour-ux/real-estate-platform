import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMock = {
  listing: {
    findUnique: vi.fn(),
  },
  checklistItem: {
    count: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

describe("co-ownership publish gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws ERR_COOWNERSHIP_PUBLISH when condo checklist incomplete and enforcement on", async () => {
    vi.resetModules();
    vi.doMock("@/config/feature-flags", () => ({
      complianceFlags: { coownershipEnforcement: true },
    }));

    const condoRow = { id: true, listingType: "CONDO", isCoOwnership: false };
    prismaMock.listing.findUnique.mockResolvedValue(condoRow);

    prismaMock.checklistItem.count.mockResolvedValueOnce(0).mockResolvedValueOnce(5);
    prismaMock.checklistItem.createMany.mockResolvedValue({ count: 5 });

    const pending = [
      { id: "1", key: "coownership_certificate", label: "a", status: "PENDING", required: true },
      { id: "2", key: "certificate_reviewed", label: "b", status: "PENDING", required: true },
      { id: "3", key: "maintenance_log", label: "c", status: "PENDING", required: true },
      { id: "4", key: "contingency_fund", label: "d", status: "PENDING", required: true },
      { id: "5", key: "seller_informed", label: "e", status: "PENDING", required: true },
    ];
    prismaMock.checklistItem.findMany.mockResolvedValue(pending);

    const { assertCoownershipPublishAllowed, ERR_COOWNERSHIP_PUBLISH } = await import(
      "../coownershipCompliance.service"
    );

    await expect(assertCoownershipPublishAllowed("lid")).rejects.toThrow(ERR_COOWNERSHIP_PUBLISH);
  });
});
