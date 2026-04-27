import { describe, expect, it } from "vitest";
import { getPoolStats } from "../pool-core";

/**
 * Order 73.1 — pool stats shape for readiness; no second `pg.Client` in app code (see repo grep).
 */
describe("Order 73.1 — getPoolStats", () => {
  it("returns total, idle, waiting as non-negative numbers", () => {
    const s = getPoolStats();
    expect(typeof s.total).toBe("number");
    expect(typeof s.idle).toBe("number");
    expect(typeof s.waiting).toBe("number");
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.idle).toBeGreaterThanOrEqual(0);
    expect(s.waiting).toBeGreaterThanOrEqual(0);
  });
});
