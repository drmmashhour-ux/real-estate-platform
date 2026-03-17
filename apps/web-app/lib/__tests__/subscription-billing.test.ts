/**
 * Unit tests for subscription and billing – plans, entitlement check.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActiveSubscription, hasEntitlement } from "@/lib/subscription-billing";

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: { findFirst: vi.fn(), findMany: vi.fn() },
    subscriptionPlan: { findUnique: vi.fn(), findMany: vi.fn() },
    billingEvent: { create: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Subscription billing", () => {
  beforeEach(() => {
    vi.mocked(prisma.subscription.findFirst).mockReset();
    vi.mocked(prisma.subscriptionPlan.findMany).mockReset();
    vi.mocked(prisma.subscriptionPlan.findUnique).mockReset();
  });

  describe("getActiveSubscription", () => {
    it("returns null when no active subscription", async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      const sub = await getActiveSubscription("user-1");
      expect(sub).toBeNull();
    });

    it("returns subscription when active", async () => {
      const plan = { id: "P1", slug: "host-pro", name: "Host Pro", amountCents: 1999, billingCycle: "MONTHLY", features: { maxListings: 10 }, trialDays: 0, module: "HOST_PRO", scope: "GLOBAL", scopeValue: null, active: true, createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: "S1",
        userId: "user-1",
        planId: "P1",
        plan,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const sub = await getActiveSubscription("user-1");
      expect(sub?.plan.slug).toBe("host-pro");
      expect(sub?.status).toBe("ACTIVE");
    });
  });

  describe("hasEntitlement", () => {
    it("returns allowed false when no subscription", async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      const r = await hasEntitlement("user-1", "analytics");
      expect(r.allowed).toBe(false);
    });

    it("returns allowed true when plan has feature true", async () => {
      const plan = { id: "P1", slug: "pro", name: "Pro", amountCents: 999, billingCycle: "MONTHLY", features: { analytics: true }, trialDays: 0, module: "HOST_PRO", scope: "GLOBAL", scopeValue: null, active: true, createdAt: new Date(), updatedAt: new Date() };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
        id: "S1", userId: "u1", planId: "P1", plan, status: "ACTIVE",
        currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 86400000),
        cancelAtPeriodEnd: false, createdAt: new Date(), updatedAt: new Date(),
      });
      const r = await hasEntitlement("u1", "analytics");
      expect(r.allowed).toBe(true);
    });
  });
});
