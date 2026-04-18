import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    subscription: {
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
  },
}));

describe("revenue-guard.service", () => {
  beforeEach(() => {
    vi.resetModules();
    findFirst.mockReset();
    vi.stubEnv("FEATURE_REVENUE_ENFORCEMENT_V1", "");
    vi.stubEnv("REVENUE_ENFORCEMENT_BLOCK_CHECKOUT", "");
    vi.stubEnv("REVENUE_ENFORCEMENT_DEV_BYPASS_USER_IDS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns allowed when enforcement flag is off", async () => {
    const { canAccessRevenueFeature } = await import("@/modules/revenue/revenue-guard.service");
    const r = await canAccessRevenueFeature({ userId: "u1", feature: "lead_unlock" });
    expect(r).toEqual({ allowed: true, reason: "ok" });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns structured response when enforcement is on (default soft allow)", async () => {
    vi.stubEnv("FEATURE_REVENUE_ENFORCEMENT_V1", "1");
    findFirst.mockResolvedValue(null);
    const { canAccessRevenueFeature } = await import("@/modules/revenue/revenue-guard.service");
    const r = await canAccessRevenueFeature({ userId: "u1", feature: "lead_unlock" });
    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("not_paid");
  });

  it("allows bypass users when enforcement is on", async () => {
    vi.stubEnv("FEATURE_REVENUE_ENFORCEMENT_V1", "1");
    vi.stubEnv("REVENUE_ENFORCEMENT_DEV_BYPASS_USER_IDS", "u1");
    findFirst.mockResolvedValue(null);
    const { canAccessRevenueFeature } = await import("@/modules/revenue/revenue-guard.service");
    const r = await canAccessRevenueFeature({ userId: "u1", feature: "lead_unlock" });
    expect(r).toEqual({ allowed: true, reason: "ok" });
  });

  it("soft-blocks when block-checkout is enabled and user has no subscription", async () => {
    vi.stubEnv("FEATURE_REVENUE_ENFORCEMENT_V1", "1");
    vi.stubEnv("REVENUE_ENFORCEMENT_BLOCK_CHECKOUT", "1");
    findFirst.mockResolvedValue(null);
    const { canAccessRevenueFeature } = await import("@/modules/revenue/revenue-guard.service");
    const r = await canAccessRevenueFeature({ userId: "u2", feature: "lead_unlock" });
    expect(r).toEqual({ allowed: false, reason: "not_paid" });
  });
});
