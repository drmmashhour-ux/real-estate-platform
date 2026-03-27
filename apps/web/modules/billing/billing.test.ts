import { describe, expect, it, vi, beforeEach } from "vitest";
import { SubscriptionStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
    },
  },
}));

describe("workspace entitlements", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns free tier when no active subscription", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);

    const { getWorkspaceEntitlements } = await import("@/modules/billing/getPlanEntitlements");
    const e = await getWorkspaceEntitlements("user-1");
    expect(e.planTier).toBe("free");
    expect(e.hasActivePaidWorkspace).toBe(false);
    expect(e.trustgraphPremium).toBe(false);
    expect(e.dealAnalyzerAdvanced).toBe(false);
  });

  it("gates premium surfaces for active pro subscription", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: "x",
      workspaceId: null,
      userId: "user-1",
      stripeCustomerId: "cus_x",
      stripeSubscriptionId: "sub_x",
      stripePriceId: "price_x",
      planCode: "pro",
      status: SubscriptionStatus.active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const { getWorkspaceEntitlements } = await import("@/modules/billing/getPlanEntitlements");
    const e = await getWorkspaceEntitlements("user-1");
    expect(e.hasActivePaidWorkspace).toBe(true);
    expect(e.trustgraphPremium).toBe(true);
    expect(e.dealAnalyzerAdvanced).toBe(true);
    expect(e.enterpriseDashboards).toBe(false);
    expect(e.partnerApiAccess).toBe(false);
  });
});

describe("getSubscriptionEntitlements (monetization gate)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns free defaults when no user/workspace", async () => {
    const { getSubscriptionEntitlements } = await import("@/modules/billing/getPlanEntitlements");
    const e = await getSubscriptionEntitlements({});
    expect(e.plan).toBe("free");
    expect(e.features.copilot).toBe(false);
    expect(e.limits.maxListings).toBe(1);
  });

  it("enables copilot for active pro subscription", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: "x",
      workspaceId: null,
      userId: "user-1",
      stripeCustomerId: "cus_x",
      stripeSubscriptionId: "sub_x",
      stripePriceId: "price_x",
      planCode: "pro",
      status: SubscriptionStatus.active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const { getSubscriptionEntitlements } = await import("@/modules/billing/getPlanEntitlements");
    const e = await getSubscriptionEntitlements({ userId: "user-1" });
    expect(e.plan).toBe("pro");
    expect(e.features.copilot).toBe(true);
    expect(e.limits.maxListings).toBe(50);
  });
});
