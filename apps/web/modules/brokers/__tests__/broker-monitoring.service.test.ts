import { describe, expect, it } from "vitest";
import {
  getBrokerMonitoringSnapshot,
  recordBrokerProspectAdded,
  recordBrokerScriptCopied,
  resetBrokerMonitoringForTests,
} from "@/modules/brokers/broker-monitoring.service";

describe("broker-monitoring.service", () => {
  it("increments counters and resets for tests", () => {
    resetBrokerMonitoringForTests();
    recordBrokerProspectAdded();
    recordBrokerScriptCopied({ kind: "first_message" });
    const s = getBrokerMonitoringSnapshot();
    expect(s.prospectsAdded).toBe(1);
    expect(s.scriptsCopied).toBe(1);
    resetBrokerMonitoringForTests();
    expect(getBrokerMonitoringSnapshot().prospectsAdded).toBe(0);
  });
});
