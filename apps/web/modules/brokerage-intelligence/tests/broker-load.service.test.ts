import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyU = vi.fn();
const countDeal = vi.fn();
const countLead = vi.fn();
const findFirstLead = vi.fn();
const upsertBl = vi.fn();

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    user: { findMany: (...a: unknown[]) => findManyU(...a) },
    deal: { count: (...a: unknown[]) => countDeal(...a) },
    lead: { count: (...a: unknown[]) => countLead(...a), findFirst: (...a: unknown[]) => findFirstLead(...a) },
    brokerLoadMetric: { upsert: (...a: unknown[]) => upsertBl(...a) },
  })
}));

import { computeBrokerLoadMetrics } from "../broker-load.service";

describe("computeBrokerLoadMetrics", () => {
  beforeEach(() => {
    findManyU.mockResolvedValue([{ id: "b1" }]);
    countDeal.mockResolvedValue(2);
    countLead.mockResolvedValue(3);
    findFirstLead.mockResolvedValue({ firstContactAt: new Date(), createdAt: new Date() });
  });

  it("returns per-broker entry without throwing on upsert", async () => {
    const rows = await computeBrokerLoadMetrics({ maxBrokers: 5 });
    expect(rows.length).toBe(1);
    expect(rows[0]!.workloadScore).toBeLessThanOrEqual(100);
  });
});
