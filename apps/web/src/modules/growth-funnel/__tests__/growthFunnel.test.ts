import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasUnlimitedGrowthUsage } from "@/src/modules/growth-funnel/domain/usageLimits";

vi.mock("@/lib/auth/is-platform-admin", () => ({
  isPlatformAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/src/modules/growth-funnel/infrastructure/growthFunnelRepository", () => ({
  getOrCreateUsageCounter: vi.fn(),
}));

import { getOrCreateUsageCounter } from "@/src/modules/growth-funnel/infrastructure/growthFunnelRepository";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";

describe("growth funnel usage", () => {
  beforeEach(() => {
    vi.mocked(getOrCreateUsageCounter).mockReset();
  });

  it("treats pro plan as unlimited for paywall", () => {
    expect(hasUnlimitedGrowthUsage("pro")).toBe(true);
    expect(hasUnlimitedGrowthUsage("free")).toBe(false);
  });

  it("allows simulator when under free limit", async () => {
    vi.mocked(getOrCreateUsageCounter).mockResolvedValue({
      simulatorRuns: 2,
      aiDrafts: 0,
    } as Awaited<ReturnType<typeof getOrCreateUsageCounter>>);
    const r = await checkGrowthPaywall({
      userId: "u1",
      plan: "free",
      role: "USER",
      kind: "simulator",
    });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBeGreaterThan(0);
  });
});
