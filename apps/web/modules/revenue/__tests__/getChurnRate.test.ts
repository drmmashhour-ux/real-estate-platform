import { describe, expect, it, vi } from "vitest";
import { getChurnRate } from "../application/getChurnRate";

describe("getChurnRate", () => {
  it("computes churn as canceled / (active + canceled)", async () => {
    const db = {
      subscription: {
        count: vi
          .fn()
          .mockResolvedValueOnce(2) // canceled in window
          .mockResolvedValueOnce(8), // active paying
      },
    };
    const start = new Date("2025-01-01T00:00:00.000Z");
    const end = new Date("2025-01-31T00:00:00.000Z");
    const r = await getChurnRate(db as never, { start, end });
    expect(r.canceledInWindowCount).toBe(2);
    expect(r.activePayingCount).toBe(8);
    expect(r.churnRate).toBeCloseTo(2 / 10, 5);
  });
});
