import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateAggregatesForOutcome } from "../performance-aggregator.service";

const findUnique = vi.fn();
const upsert = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: { strategyPerformanceAggregate: { findUnique: (...a: unknown[]) => findUnique(...a), upsert: (...a: unknown[]) => upsert(...a) } },
}));

vi.mock("../strategy-benchmark-logger", () => ({
  strategyBenchmarkLog: { performance: vi.fn(), warn: vi.fn() },
}));

describe("updateAggregatesForOutcome", () => {
  beforeEach(() => {
    findUnique.mockReset();
    upsert.mockReset();
    findUnique.mockResolvedValue(null);
    upsert.mockResolvedValue({});
  });

  it("credits win mass across multiple strategies", async () => {
    await updateAggregatesForOutcome(
      [
        { strategyKey: "x", domain: "OFFER", contributionWeight: 0.6 },
        { strategyKey: "y", domain: "OFFER", contributionWeight: 0.4 },
      ],
      "WON",
      12
    );
    expect(upsert).toHaveBeenCalled();
    const calls = upsert.mock.calls.length;
    expect(calls).toBe(2);
  });
});
