import { beforeEach, describe, expect, it, vi } from "vitest";

const findInactiveUsers = vi.fn();
const findManyFeedback = vi.fn();
const findManyRevenue = vi.fn();
const countEvents = vi.fn();

vi.mock("@/lib/retention/engine", () => ({
  findInactiveUsers: () => findInactiveUsers(),
}));
vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    userFeedback: { findMany: findManyFeedback },
    marketplaceRevenueEntry: { findMany: findManyRevenue },
    marketplaceEvent: { count: countEvents },
  }),
}));

describe("getProductInsights / getProductActions (Order 57)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API contract: works with empty data", async () => {
    findInactiveUsers.mockResolvedValue([]);
    findManyFeedback.mockResolvedValue([]);
    findManyRevenue.mockResolvedValue([]);
    countEvents.mockResolvedValue(0);

    const { getProductInsights, getProductActions } = await import("@/lib/ai/productIntelligence");
    const [insights, actions] = await Promise.all([getProductInsights(), getProductActions()]);

    expect(Array.isArray(insights)).toBe(true);
    expect(Array.isArray(actions)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
    expect(actions.length).toBeGreaterThan(0);
  });

  it("inactive users drive retention-style insight and actions", async () => {
    findInactiveUsers.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({ id: `u${i}`, email: `e${i}@t.c` }))
    );
    findManyFeedback.mockResolvedValue([]);
    findManyRevenue.mockResolvedValue([{ fee: 0.5 }, { fee: 0.5 }]);
    countEvents.mockResolvedValue(5);

    const { getProductInsights, getProductActions } = await import("@/lib/ai/productIntelligence");
    const insights = await getProductInsights();
    const actions = await getProductActions();

    expect(insights.some((i) => i.type === "retention")).toBe(true);
    expect(actions.some((a) => a.id === "pi-retention-reengage")).toBe(true);
  });

  it("feedback keywords appear in feedback insights", async () => {
    findInactiveUsers.mockResolvedValue([]);
    findManyFeedback.mockResolvedValue([{ message: "The app is so confusing" }, { message: "Bug on checkout" }]);
    findManyRevenue.mockResolvedValue([{ fee: 20 }, { fee: 20 }, { fee: 20 }]);
    countEvents.mockResolvedValue(100);

    const { getProductInsights } = await import("@/lib/ai/productIntelligence");
    const insights = await getProductInsights();
    const fb = insights.filter((i) => i.type === "feedback");
    expect(fb.length).toBeGreaterThan(0);
    const joined = fb.map((f) => f.summary).join(" ");
    expect(/confus|bug/i.test(joined)).toBe(true);
  });
});
