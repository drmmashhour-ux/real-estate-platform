import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/modules/billing/getPlanEntitlements", () => ({
  getSubscriptionEntitlements: vi.fn(),
}));

describe("requireFeature", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws when copilot is false", async () => {
    const { getSubscriptionEntitlements } = await import("@/modules/billing/getPlanEntitlements");
    const { requireFeature, FeatureNotAvailableError } = await import("@/lib/featureGate");

    vi.mocked(getSubscriptionEntitlements).mockResolvedValue({
      plan: "free",
      features: {
        copilot: false,
        advancedAnalytics: false,
        premiumPlacement: false,
        maxListings: 1,
      },
      limits: { maxListings: 1 },
    });

    await expect(
      requireFeature({ userId: "u1", feature: "copilot" })
    ).rejects.toThrow(FeatureNotAvailableError);
  });

  it("resolves when copilot is true", async () => {
    const { getSubscriptionEntitlements } = await import("@/modules/billing/getPlanEntitlements");
    const { requireFeature } = await import("@/lib/featureGate");

    vi.mocked(getSubscriptionEntitlements).mockResolvedValue({
      plan: "pro",
      features: {
        copilot: true,
        advancedAnalytics: true,
        premiumPlacement: true,
        maxListings: 50,
      },
      limits: { maxListings: 50 },
    });

    await expect(requireFeature({ userId: "u1", feature: "copilot" })).resolves.toBeUndefined();
  });
});
