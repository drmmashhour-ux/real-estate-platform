import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getArmStat = vi.fn();
const recordSelection = vi.fn();
const sumBucketPulls = vi.fn();
const getActivePolicy = vi.fn();
const createDecision = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    reinforcementDecision: {
      create: (...a: unknown[]) => createDecision(...a),
    },
  },
}));

vi.mock("../arm-stats.service", () => ({
  getArmStat: (...a: unknown[]) => getArmStat(...a),
  recordSelection: (...a: unknown[]) => recordSelection(...a),
  sumBucketPulls: (...a: unknown[]) => sumBucketPulls(...a),
}));

vi.mock("../policy.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../policy.service")>();
  return { ...actual, getActivePolicy: (...a: unknown[]) => getActivePolicy(...a) };
});

import { selectStrategyWithReinforcement } from "../reinforcement.engine";

describe("selectStrategyWithReinforcement", () => {
  beforeEach(() => {
    getActivePolicy.mockResolvedValue({ id: "p1", policyType: "EPSILON_GREEDY" as const, explorationRate: 0 });
    getArmStat.mockResolvedValue(null);
    sumBucketPulls.mockResolvedValue(0);
    createDecision.mockResolvedValue({ id: "dec1" });
    recordSelection.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("excludes blocked strategies from selection", async () => {
    const r = await selectStrategyWithReinforcement({
      domain: "OFFER",
      candidates: [
        { strategyKey: "blocked", baseScore: 0.99, blocked: true },
        { strategyKey: "ok", baseScore: 0.2, blocked: false },
      ],
      context: { offerReadinessBand: "high" },
      dealId: "deal-x",
      auditRoll: 0.99,
    });
    expect(r.strategyKey).toBe("ok");
    expect(r.adjustedRanking.every((x) => x.strategyKey !== "blocked")).toBe(true);
  });

  it("falls back when all blocked", async () => {
    const r = await selectStrategyWithReinforcement({
      domain: "OFFER",
      candidates: [
        { strategyKey: "b1", baseScore: 0.5, blocked: true },
        { strategyKey: "b2", baseScore: 0.6, blocked: true },
      ],
      context: {},
    });
    expect(r.strategyKey).toBe("b1");
    expect(r.rationale.some((x) => x.includes("No non-blocked"))).toBe(true);
  });

  it("prefers higher baseScore with cold arm stats and zero exploration", async () => {
    const r = await selectStrategyWithReinforcement({
      domain: "OFFER",
      candidates: [
        { strategyKey: "lo", baseScore: 0.1, blocked: false },
        { strategyKey: "hi", baseScore: 0.9, blocked: false },
      ],
      context: { offerReadinessBand: "high" },
      dealId: "ab",
      auditRoll: 0.5,
    });
    expect(r.selectionMode).toBe("exploit");
    expect(r.adjustedRanking[0]?.strategyKey).toBe("hi");
  });

  it("creates a decision row when DB succeeds", async () => {
    await selectStrategyWithReinforcement({
      domain: "CLOSING",
      candidates: [{ strategyKey: "a", baseScore: 0.5 }],
      context: {},
      dealId: "d1",
    });
    expect(createDecision).toHaveBeenCalled();
  });
});
