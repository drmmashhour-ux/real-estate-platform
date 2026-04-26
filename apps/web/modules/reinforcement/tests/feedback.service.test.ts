import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const findMany = vi.fn();
const update = vi.fn();
const recordReward = vi.fn();

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    reinforcementDecision: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      update: (...a: unknown[]) => update(...a),
    },
  })
}));

vi.mock("../arm-stats.service", () => ({
  recordReward: (...a: unknown[]) => recordReward(...a),
}));

import { recordStrategyOutcomeFeedback } from "../feedback.service";

describe("recordStrategyOutcomeFeedback", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findMany.mockReset();
    update.mockReset();
    recordReward.mockReset();
  });

  it("updates decision and arm by decisionId", async () => {
    findUnique.mockResolvedValue({
      id: "dec-1",
      domain: "OFFER",
      strategyKey: "rec_price",
      contextBucket: "x|y",
    });
    const r = await recordStrategyOutcomeFeedback({ decisionId: "dec-1", outcome: "WON" });
    expect(r.ok).toBe(true);
    expect(r.updated).toBe(1);
    expect(update).toHaveBeenCalled();
    expect(recordReward).toHaveBeenCalledWith("OFFER", "rec_price", "x|y", expect.any(Number), "WON");
  });

  it("applies to open decisions for dealId", async () => {
    findUnique.mockResolvedValue(null);
    findMany.mockResolvedValue([
      { id: "d1", domain: "OFFER", strategyKey: "a", contextBucket: "b" },
      { id: "d2", domain: "OFFER", strategyKey: "c", contextBucket: "d" },
    ]);
    const r = await recordStrategyOutcomeFeedback({ dealId: "deal-9", outcome: "LOST" });
    expect(r.ok).toBe(true);
    expect(r.updated).toBe(2);
    expect(recordReward).toHaveBeenCalled();
  });

  it("never throws on DB errors", async () => {
    findUnique.mockImplementation(() => {
      throw new Error("db");
    });
    const r = await recordStrategyOutcomeFeedback({ decisionId: "x", outcome: "STALLED" });
    expect(r.ok).toBe(false);
    expect(r.updated).toBe(0);
  });
});
