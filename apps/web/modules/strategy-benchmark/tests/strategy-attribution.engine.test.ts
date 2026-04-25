import { describe, expect, it, vi, beforeEach } from "vitest";
import { attributeOutcomeToStrategies } from "../strategy-attribution.engine";

const findMany = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: { strategyExecutionEvent: { findMany: (...a: unknown[]) => findMany(...a) } },
}));

vi.mock("../strategy-benchmark-logger", () => ({
  strategyBenchmarkLog: { attribution: vi.fn(), warn: vi.fn() },
}));

describe("attributeOutcomeToStrategies", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("returns empty when no events", async () => {
    findMany.mockResolvedValue([]);
    const r = await attributeOutcomeToStrategies("d1", "WON", null);
    expect(r.attributedStrategies).toEqual([]);
  });

  it("normalizes multiple strategies on one deal", async () => {
    const t0 = new Date("2025-01-01T00:00:00Z");
    const t1 = new Date("2025-01-08T00:00:00Z");
    findMany.mockResolvedValue([
      { createdAt: t0, strategyKey: "a", domain: "NEGOTIATION" },
      { createdAt: t1, strategyKey: "b", domain: "NEGOTIATION" },
    ]);
    const r = await attributeOutcomeToStrategies("d1", "WON", 10);
    expect(r.attributedStrategies.length).toBe(2);
    const sum = r.attributedStrategies.reduce((s, x) => s + x.contributionWeight, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
