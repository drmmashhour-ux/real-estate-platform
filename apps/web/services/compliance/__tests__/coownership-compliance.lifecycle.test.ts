import { describe, expect, it, vi, beforeEach } from "vitest";

import { MERGED_COOWNERSHIP_CHECKLIST } from "../coownership-merged-definitions";

const prismaMock = {
  listing: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  checklistItem: {
    count: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  listingComplianceSnapshot: {
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

describe("co-ownership publish gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.listing.update.mockResolvedValue({});
    prismaMock.listingComplianceSnapshot.upsert.mockResolvedValue({});
  });

  it("throws ERR_COOWNERSHIP_PUBLISH when condo checklist incomplete and enforcement on", async () => {
    vi.resetModules();
    vi.doMock("@/config/feature-flags", () => ({
      complianceFlags: {
        coownershipEnforcement: true,
        coownershipInsuranceEnforcement: false,
        coownershipComplianceEnforcement: false,
      },
    }));

    const condoRow = { listingType: "CONDO", isCoOwnership: false };
    prismaMock.listing.findUnique.mockResolvedValue(condoRow);

    const pending = MERGED_COOWNERSHIP_CHECKLIST.map((def, i) => ({
      id: `id-${i}`,
      key: def.key,
      label: def.label,
      description: def.description ?? null,
      category: def.category,
      priority: def.priority,
      status: "PENDING" as const,
      required: def.required,
      source: def.source ?? null,
    }));

    prismaMock.checklistItem.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(MERGED_COOWNERSHIP_CHECKLIST.length);
    prismaMock.checklistItem.createMany.mockResolvedValue({ count: MERGED_COOWNERSHIP_CHECKLIST.length });

    prismaMock.checklistItem.findMany.mockResolvedValue(pending);

    const { assertCoownershipPublishAllowed, ERR_COOWNERSHIP_PUBLISH } = await import(
      "../coownershipCompliance.service"
    );

    await expect(assertCoownershipPublishAllowed("lid")).rejects.toThrow(ERR_COOWNERSHIP_PUBLISH);
  });
});
