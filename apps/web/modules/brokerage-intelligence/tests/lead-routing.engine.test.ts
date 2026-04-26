import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyUser = vi.fn();
const wbr = vi.fn();

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    user: { findMany: (...a: unknown[]) => findManyUser(...a) },
    workspaceBrokerReputation: { findMany: (...a: unknown[]) => wbr(...a) },
  })
}));

vi.mock("../broker-load.service", () => ({
  getLoadMetricsSnapshot: vi.fn().mockResolvedValue({ a: 30, b: 70 }),
}));

import { recommendBrokerForLead } from "../lead-routing.engine";

describe("recommendBrokerForLead", () => {
  beforeEach(() => {
    findManyUser.mockReset();
    wbr.mockReset();
    wbr.mockResolvedValue([]);
    findManyUser.mockImplementation(() => [
      { id: "a", homeRegion: "quebec", homeCity: "montreal" },
      { id: "b", homeRegion: "ontario", homeCity: "ottawa" },
    ]);
  });

  it("returns a recommendation when brokers exist and never throws", async () => {
    const r = await recommendBrokerForLead({
      id: "l1",
      location: "montreal",
      purchaseRegion: "montreal",
    });
    expect(r.recommendedBrokerId).toBeTruthy();
    expect(r.rationale.length).toBeGreaterThan(0);
  });
});
