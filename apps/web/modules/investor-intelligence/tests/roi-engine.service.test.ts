import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const count = vi.fn();
const aggregate = vi.fn();
const upsert = vi.fn();
const spFind = vi.fn();

vi.mock("@repo/db", () => ({
  prisma: {
    deal: { findMany: (...a: unknown[]) => findMany(...a) },
    lead: { aggregate: (...a: unknown[]) => aggregate(...a) },
    roiPerformanceAggregate: { upsert: (...a: unknown[]) => upsert(...a) },
    strategyPerformanceAggregate: { findMany: (...a: unknown[]) => spFind(...a) },
  },
}));

import { analyzeRoiPerformance } from "../roi-engine.service";

describe("analyzeRoiPerformance", () => {
  it("returns empty on failure without throw", async () => {
    findMany.mockRejectedValue(new Error("db"));
    const r = await analyzeRoiPerformance({ persist: false });
    expect(r).toEqual([]);
  });

  it("degrades when no spend in row", async () => {
    findMany.mockResolvedValue([
      {
        id: "1",
        priceCents: 500_000_00,
        status: "closed",
        brokerId: "b1",
        jurisdiction: "QC",
        crmStage: "x",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-02-01"),
        lead: { leadSource: "web", dynamicLeadPriceCents: null, estimatedValue: null },
      },
    ]);
    spFind.mockResolvedValue([]);
    upsert.mockResolvedValue({});
    aggregate.mockResolvedValue({ _sum: { dynamicLeadPriceCents: null } });
    const r = await analyzeRoiPerformance({ persist: true });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]!.estimatedLeadSpend).toBeNull();
  });
});
