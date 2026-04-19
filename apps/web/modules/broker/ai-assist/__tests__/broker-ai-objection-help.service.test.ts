import { describe, expect, it } from "vitest";

import { buildObjectionGuidance } from "@/modules/broker/ai-assist/broker-ai-objection-help.service";

describe("broker-ai-objection-help.service", () => {
  it("covers no-reply contacted state", () => {
    const g = buildObjectionGuidance({
      stage: "contacted",
      responseReceived: false,
      idleHours: 60,
    });
    expect(g.whatToSayNext.length).toBeGreaterThan(5);
    expect(g.whatToAvoid.length).toBeGreaterThan(3);
  });
});
