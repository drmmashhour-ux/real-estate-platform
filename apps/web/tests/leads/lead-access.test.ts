import { describe, expect, it } from "vitest";
import { canAccessLead, toLead } from "@/lib/leads/service";
import type { ListingContactLeadPurchase } from "@prisma/client";

function mockRow(overrides: Partial<ListingContactLeadPurchase>): ListingContactLeadPurchase {
  const base = {
    id: "p1",
    buyerUserId: "u1",
    targetKind: "FSBO_LISTING" as const,
    targetListingId: "L1",
    status: "locked",
    priceCents: 100,
    stripeCheckoutSessionId: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { ...base, ...overrides } as ListingContactLeadPurchase;
}

describe("listing contact lead access", () => {
  it("canAccessLead is false until paid", () => {
    const lead = toLead(mockRow({ status: "locked" }));
    expect(canAccessLead(lead)).toBe(false);
    expect(toLead(mockRow({ status: "paid" })).status).toBe("paid");
    expect(canAccessLead(toLead(mockRow({ status: "paid" })))).toBe(true);
  });
});
