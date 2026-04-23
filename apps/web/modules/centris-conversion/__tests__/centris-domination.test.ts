import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeCentrisLeadScore } from "../centris-lead-score.service";
import { resolveBrokerForCentrisListing } from "../centris-broker-routing.service";

const dbMocks = vi.hoisted(() => ({
  leadFindUnique: vi.fn(),
  timelineFindMany: vi.fn(),
  fsboFindUnique: vi.fn(),
  listingFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      findUnique: dbMocks.leadFindUnique,
    },
    leadTimelineEvent: {
      findMany: dbMocks.timelineFindMany,
    },
    fsboListing: {
      findUnique: dbMocks.fsboFindUnique,
    },
    listing: {
      findUnique: dbMocks.listingFindUnique,
    },
    buyerListingView: {
      count: vi.fn(),
    },
  },
}));

describe("Centris Lead Domination", () => {
  beforeEach(() => {
    dbMocks.leadFindUnique.mockReset();
    dbMocks.timelineFindMany.mockReset();
    dbMocks.fsboFindUnique.mockReset();
    dbMocks.listingFindUnique.mockReset();
  });

  it("scores leads from timeline density", async () => {
    dbMocks.leadFindUnique.mockResolvedValue({
      distributionChannel: "CENTRIS",
      dealValue: 500_000,
      estimatedValue: 500_000,
      highIntent: true,
      createdAt: new Date(),
      userId: null,
    });
    dbMocks.timelineFindMany.mockResolvedValue([
      { eventType: "FUNNEL_VIEW", payload: {}, createdAt: new Date() },
      { eventType: "FUNNEL_CONTACT", payload: { intent: "unlock_analysis" }, createdAt: new Date() },
    ]);

    const r = await computeCentrisLeadScore("l1");
    expect(r.score).toBeGreaterThanOrEqual(45);
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(r.intentLevel);
  });

  it("routes FSBO listings to owner broker", async () => {
    dbMocks.fsboFindUnique.mockResolvedValueOnce({
      ownerId: "broker-1",
      city: "Montreal",
    });

    const r = await resolveBrokerForCentrisListing("fsbo-1");
    expect(r.bestBrokerId).toBe("broker-1");
    expect(r.routingReason).toContain("FSBO");
  });

  it("falls through to CRM listing owner", async () => {
    dbMocks.fsboFindUnique.mockResolvedValue(null);
    dbMocks.listingFindUnique.mockResolvedValue({
      ownerId: "broker-2",
    } as any);

    const r = await resolveBrokerForCentrisListing("crm-1");
    expect(r.bestBrokerId).toBe("broker-2");
  });
});
