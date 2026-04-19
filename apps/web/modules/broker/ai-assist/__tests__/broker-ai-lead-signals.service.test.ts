import { describe, expect, it } from "vitest";

import { buildBrokerAiLeadSignals } from "@/modules/broker/ai-assist/broker-ai-lead-signals.service";

describe("broker-ai-lead-signals.service", () => {
  it("flags cooling when idle is high", () => {
    const now = Date.now();
    const signals = buildBrokerAiLeadSignals({
      leadId: "l1",
      closing: {
        leadId: "l1",
        brokerId: "b1",
        stage: "contacted",
        responseReceived: false,
        lastContactAt: new Date(now - 100 * 3600000).toISOString(),
        createdAt: new Date(now - 200 * 3600000).toISOString(),
        updatedAt: new Date(now - 100 * 3600000).toISOString(),
      },
      score: 40,
      nowMs: now,
    });
    expect(signals.some((s) => s.signalType === "cooling_down")).toBe(true);
  });

  it("does not emit negative fabricated probabilities", () => {
    const sig = buildBrokerAiLeadSignals({
      leadId: "l1",
      closing: {
        leadId: "l1",
        brokerId: "b1",
        stage: "new",
        responseReceived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      score: 10,
      nowMs: Date.now(),
    });
    expect(sig.every((s) => !/\d+%/.test(s.description))).toBe(true);
  });
});
