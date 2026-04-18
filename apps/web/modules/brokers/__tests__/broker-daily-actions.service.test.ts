import { describe, expect, it } from "vitest";
import { getBrokerDailyActions } from "@/modules/brokers/broker-daily-actions.service";
import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";

function p(over: Partial<BrokerProspect> & Pick<BrokerProspect, "id" | "name" | "stage">): BrokerProspect {
  const t = new Date().toISOString();
  return {
    createdAt: t,
    updatedAt: t,
    ...over,
  };
}

describe("getBrokerDailyActions", () => {
  it("returns bounded list of actions", () => {
    const actions = getBrokerDailyActions({
      prospects: [p({ id: "1", name: "A", stage: "new" })],
    });
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(5);
  });

  it("suggests follow-ups when contacted exist", () => {
    const actions = getBrokerDailyActions({
      prospects: [p({ id: "1", name: "A", stage: "contacted", email: "a@x.com" })],
    });
    expect(actions.some((l) => /follow-up/i.test(l))).toBe(true);
  });
});
