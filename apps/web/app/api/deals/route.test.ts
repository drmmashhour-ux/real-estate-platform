import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/codes/generate-code", () => ({
  generateDealCode: vi.fn().mockResolvedValue("DEL-000001"),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    deal: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    lead: { findFirst: vi.fn() },
    leadContactAuditEvent: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    brokerVerification: { findUnique: vi.fn() },
    shortTermListing: { findFirst: vi.fn(), findUnique: vi.fn() },
    contract: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

describe("GET /api/deals", () => {
  beforeEach(() => {
    vi.mocked(prisma.deal.findMany).mockResolvedValue([]);
  });

  it("returns 401 when user is not signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const req = new Request("http://x/api/deals");
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Sign in/i);
  });

  it("returns 200 with deals array when signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(prisma.deal.findMany).mockResolvedValue([
      { id: "d1", buyerId: "user-1", sellerId: "s1", brokerId: null, priceCents: 100000, status: "ACTIVE", createdAt: new Date(), updatedAt: new Date(), listingId: null, listingCode: null, buyer: {}, seller: {}, broker: null, milestones: [], _count: { documents: 0, payments: 0 } },
    ] as never[]);
    const req = new Request("http://x/api/deals");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.deals)).toBe(true);
    expect(data.deals).toHaveLength(1);
  });
});

describe("POST /api/deals", () => {
  beforeEach(() => {
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn === "function") {
        return fn({ deal: { create: prisma.deal.create } } as never);
      }
      return undefined;
    });
    vi.mocked(getGuestId).mockResolvedValue("broker-1");
    vi.mocked(prisma.lead.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.shortTermListing.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.shortTermListing.findUnique).mockImplementation(
      async (args: { select?: Record<string, boolean> }) => {
        const s = args.select ?? {};
        if (s.ownerId) {
          return { id: "list-1", listingCode: "LEC-1", ownerId: "seller-1" } as never;
        }
        return { id: "list-1", listingCode: "LEC-1" } as never;
      }
    );
    vi.mocked(prisma.user.findUnique).mockImplementation(async (args: { where: { id?: string; email?: string } }) => {
      if (args.where.email) {
        return { id: "buyer-1", email: args.where.email } as never;
      }
      return {
        role: "BROKER",
        brokerStatus: "VERIFIED",
        accountStatus: "ACTIVE",
      } as never;
    });
    vi.mocked(prisma.brokerVerification.findUnique).mockResolvedValue({
      verificationStatus: "VERIFIED",
    } as never);
    vi.mocked(prisma.deal.create).mockResolvedValue({
      id: "deal-1",
      buyerId: "buyer-1",
      sellerId: "seller-1",
      brokerId: "broker-1",
      priceCents: 200000,
      status: "initiated",
      createdAt: new Date(),
      updatedAt: new Date(),
      listingId: "list-1",
      listingCode: "LEC-1",
      buyer: { id: "buyer-1", name: null, email: "b@x.com" },
      seller: { id: "seller-1", name: null, email: "s@x.com" },
      broker: { id: "broker-1", name: null, email: "broker@x.com" },
    } as never);
    vi.mocked(prisma.contract.findFirst).mockResolvedValue({
      id: "contract-broker-1",
      type: "BROKER_AGREEMENT",
      userId: "broker-1",
      status: "signed",
      signedAt: new Date(),
      fsboListingId: null,
      listingId: null,
      bookingId: null,
    } as never);
  });

  it("returns 401 when user is not signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const req = new Request("http://x/api/deals", {
      method: "POST",
      body: JSON.stringify({ listingId: "list-1", priceCents: 100000, buyerEmail: "b@x.com" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when client sends buyerId, sellerId, or brokerId", async () => {
    const req = new Request("http://x/api/deals", {
      method: "POST",
      body: JSON.stringify({
        listingId: "list-1",
        priceCents: 100000,
        buyerEmail: "b@x.com",
        buyerId: "evil",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/buyerId/i);
  });

  it("returns 400 when listingId or priceCents missing", async () => {
    const req = new Request("http://x/api/deals", {
      method: "POST",
      body: JSON.stringify({ buyerEmail: "b@x.com" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/listingId/i);
  });

  it("returns 400 when broker omits buyerEmail", async () => {
    const req = new Request("http://x/api/deals", {
      method: "POST",
      body: JSON.stringify({ listingId: "list-1", priceCents: 150000 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/buyerEmail/i);
  });

  it("returns 200 with deal when broker creates deal", async () => {
    const req = new Request("http://x/api/deals", {
      method: "POST",
      body: JSON.stringify({
        listingId: "list-1",
        priceCents: 150000,
        buyerEmail: "buyer@example.com",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("deal-1");
    expect(data.buyerId).toBe("buyer-1");
    expect(data.sellerId).toBe("seller-1");
    expect(data.brokerId).toBe("broker-1");
    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dealCode: "DEL-000001",
          buyerId: "buyer-1",
          sellerId: "seller-1",
          brokerId: "broker-1",
          listingId: "list-1",
        }),
      })
    );
  });

  it("sets buyerId to session user when USER acts as buyer", async () => {
    vi.mocked(getGuestId).mockResolvedValue("buyer-self");
    vi.mocked(prisma.user.findUnique).mockImplementation(async (args: { where: { id?: string; email?: string } }) => {
      if (args.where.email) return null as never;
      return { role: "USER", brokerStatus: "NONE", accountStatus: "ACTIVE" } as never;
    });
    vi.mocked(prisma.deal.create).mockResolvedValue({
      id: "deal-2",
      buyerId: "buyer-self",
      sellerId: "seller-1",
      brokerId: null,
      priceCents: 100,
      status: "initiated",
      createdAt: new Date(),
      updatedAt: new Date(),
      listingId: "list-1",
      listingCode: "LEC-1",
      buyer: { id: "buyer-self", name: null, email: "x@x.com" },
      seller: { id: "seller-1", name: null, email: "s@x.com" },
      broker: null,
    } as never);

    const req = new Request("http://x/api/deals", {
      method: "POST",
      body: JSON.stringify({ listingId: "list-1", priceCents: 9900 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dealCode: "DEL-000001",
          buyerId: "buyer-self",
          sellerId: "seller-1",
          brokerId: undefined,
        }),
      })
    );
  });
});
