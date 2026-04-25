import { describe, expect, it, vi } from "vitest";

const create = vi.fn();
vi.mock("@repo/db", () => ({
  prisma: { expansionScenario: { create: (...a: unknown[]) => create(...a) } },
}));

import { simulateInvestmentScenario } from "../scenario-simulator.service";

describe("simulateInvestmentScenario", () => {
  it("has explicit disclaimer and no guaranteed return", async () => {
    const r = await simulateInvestmentScenario(
      { marketKey: "M", action: "increase_broker_capacity", assumptions: { capacityDeltaPct: 5 } },
      "u1"
    );
    expect(r.disclaimer.toLowerCase()).toContain("not a forecast");
    expect(r.confidence).toBe("low");
  });
});
