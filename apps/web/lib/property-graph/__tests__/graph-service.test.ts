/**
 * Tests for property graph service – node/edge assembly, relations, market.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPropertyGraph, getOrCreateMarket, addGraphEdge } from "@/lib/property-graph/graph-service";

vi.mock("@/lib/db", () => ({
  prisma: {
    propertyIdentity: { findUnique: vi.fn() },
    propertyGraphEdge: { findMany: vi.fn(), create: vi.fn() },
    market: { findUnique: vi.fn(), create: vi.fn(), findFirst: vi.fn() },
    user: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Property graph service", () => {
  beforeEach(() => {
    vi.mocked(prisma.propertyIdentity.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.propertyGraphEdge.findMany).mockResolvedValue([]);
  });

  describe("getPropertyGraph", () => {
    it("returns null when property not found", async () => {
      vi.mocked(prisma.propertyIdentity.findUnique).mockResolvedValue(null);
      const result = await getPropertyGraph("pid-1");
      expect(result).toBeNull();
    });

    it("returns graph with property node when identity exists", async () => {
      vi.mocked(prisma.propertyIdentity.findUnique).mockResolvedValue({
        id: "pid-1",
        propertyUid: "uid-1",
        cadastreNumber: "cad-1",
        officialAddress: "123 Main",
        normalizedAddress: "123 main st",
        municipality: "Montreal",
        province: "QC",
        country: "CA",
        postalCode: null,
        latitude: 45.5,
        longitude: -73.5,
        propertyType: "residential",
        verificationScore: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
        shortTermListings: [],
        realEstateTransactions: [],
        propertyValuations: [],
        owners: [],
        events: [],
        riskRecords: [],
        links: [],
        verifications: [],
      } as never);
      const result = await getPropertyGraph("pid-1");
      expect(result).not.toBeNull();
      expect(result!.property.type).toBe("PROPERTY");
      expect(result!.property.data.cadastre_number).toBe("cad-1");
      expect(result!.nodes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getOrCreateMarket", () => {
    it("creates market when not found", async () => {
      vi.mocked(prisma.market.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.market.create).mockResolvedValue({
        id: "m1",
        city: null,
        municipality: "Montreal",
        province: "QC",
        country: "CA",
        slug: "montreal-qc-ca",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
      const market = await getOrCreateMarket({ municipality: "Montreal", province: "QC", country: "CA" });
      expect(market.slug).toBe("montreal-qc-ca");
      expect(prisma.market.create).toHaveBeenCalled();
    });
  });

  describe("addGraphEdge", () => {
    it("creates edge with correct types", async () => {
      vi.mocked(prisma.propertyGraphEdge.create).mockResolvedValue({
        id: "e1",
        fromEntityType: "PROPERTY",
        fromEntityId: "p1",
        toEntityType: "PROPERTY",
        toEntityId: "p2",
        edgeType: "SIMILAR_TO",
        metadata: { score: 0.9 },
        createdAt: new Date(),
      } as never);
      const e = await addGraphEdge({
        fromEntityType: "PROPERTY",
        fromEntityId: "p1",
        toEntityType: "PROPERTY",
        toEntityId: "p2",
        edgeType: "SIMILAR_TO",
        metadata: { score: 0.9 },
      });
      expect(e.edgeType).toBe("SIMILAR_TO");
      expect(prisma.propertyGraphEdge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fromEntityType: "PROPERTY",
            toEntityType: "PROPERTY",
            edgeType: "SIMILAR_TO",
            metadata: { score: 0.9 },
          }),
        })
      );
    });
  });
});
