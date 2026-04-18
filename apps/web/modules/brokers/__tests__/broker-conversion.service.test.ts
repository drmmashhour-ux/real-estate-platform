import { afterEach, describe, expect, it } from "vitest";
import { markBrokerConverted, tryMarkProspectConvertedByBrokerEmail } from "@/modules/brokers/broker-conversion.service";
import {
  __resetBrokerPipelineStoreForTests,
  createBrokerProspect,
} from "@/modules/brokers/broker-pipeline.service";
import { getBrokerMonitoringSnapshot, resetBrokerMonitoringForTests } from "@/modules/brokers/broker-monitoring.service";

describe("broker-conversion.service", () => {
  afterEach(() => {
    __resetBrokerPipelineStoreForTests();
    resetBrokerMonitoringForTests();
  });

  it("markBrokerConverted sets purchase fields", () => {
    const p = createBrokerProspect({ name: "X", email: "x@y.com" });
    const out = markBrokerConverted({
      prospectId: p.id,
      firstPurchaseDate: "2026-04-01",
      totalSpent: 49,
    });
    expect(out?.stage).toBe("converted");
    expect(out?.firstPurchaseDate).toBe("2026-04-01");
    expect(out?.totalSpent).toBe(49);
  });

  it("tryMarkProspectConvertedByBrokerEmail matches case-insensitively", () => {
    const p = createBrokerProspect({ name: "Y", email: "Broker@Example.com" });
    const out = tryMarkProspectConvertedByBrokerEmail({
      email: "broker@example.com",
      firstPurchaseDate: "2026-04-02",
      totalSpentCents: 4900,
    });
    expect(out?.id).toBe(p.id);
    expect(out?.totalSpent).toBe(49);
  });

  it("tryMarkProspectConvertedByBrokerEmail does not increment conversion monitoring twice", () => {
    const p = createBrokerProspect({ name: "Z", email: "z@dup.com" });
    tryMarkProspectConvertedByBrokerEmail({
      email: "z@dup.com",
      firstPurchaseDate: "2026-04-01",
    });
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(1);
    tryMarkProspectConvertedByBrokerEmail({
      email: "z@dup.com",
      firstPurchaseDate: "2026-05-01",
    });
    expect(getBrokerMonitoringSnapshot().conversionsMarked).toBe(1);
  });
});
