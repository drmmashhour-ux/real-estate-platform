import { describe, expect, it, vi, beforeEach } from "vitest";
import { mapDealToStrategyOutcome, trackDealOutcome } from "../outcome-tracking.service";

const findUnique = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    strategyOutcomeEvent: { findUnique: (...a: unknown[]) => findUnique(...a), create: (...a: unknown[]) => create(...a) },
  })
}));

vi.mock("../strategy-attribution.engine", () => ({
  attributeOutcomeToStrategies: vi.fn().mockResolvedValue({
    attributedStrategies: [
      { strategyKey: "a", domain: "OFFER", contributionWeight: 0.6 },
      { strategyKey: "b", domain: "OFFER", contributionWeight: 0.4 },
    ],
  }),
}));

vi.mock("../performance-aggregator.service", () => ({
  updateAggregatesForOutcome: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../strategy-benchmark-logger", () => ({
  strategyBenchmarkLog: { outcome: vi.fn(), warn: vi.fn() },
}));

describe("mapDealToStrategyOutcome", () => {
  it("maps closed and cancelled", () => {
    expect(mapDealToStrategyOutcome({ status: "closed" })).toBe("WON");
    expect(mapDealToStrategyOutcome({ status: "cancelled" })).toBe("LOST");
  });

  it("returns STALLED for CRM stage hint", () => {
    expect(mapDealToStrategyOutcome({ status: "initiated", crmStage: "on-hold / review" })).toBe("STALLED");
  });
});

describe("trackDealOutcome", () => {
  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "o1" });
  });

  it("creates first outcome and runs aggregation path", async () => {
    await trackDealOutcome({
      id: "d1",
      status: "closed",
      crmStage: "x",
      createdAt: new Date("2020-01-01"),
      updatedAt: new Date("2020-01-10"),
    });
    expect(create).toHaveBeenCalled();
  });

  it("is idempotent if outcome row exists", async () => {
    findUnique.mockResolvedValue({ id: "o" });
    await trackDealOutcome({
      id: "d1",
      status: "closed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(create).not.toHaveBeenCalled();
  });
});
