import { describe, expect, it } from "vitest";
import { forecastObjectionPath } from "../objection-path.engine";
import type { NegotiationSimulatorContext } from "../negotiation-simulator.types";

describe("forecastObjectionPath", () => {
  it("flags financing when weak", () => {
    const c: NegotiationSimulatorContext = { financingReadiness: "weak" };
    const f = forecastObjectionPath(c);
    expect(f.likelyObjections.some((o) => o.type.includes("financ"))).toBe(true);
  });

  it("yields a fallback when empty", () => {
    const c: NegotiationSimulatorContext = { trustLevel: "medium" };
    const f = forecastObjectionPath(c);
    expect(f.likelyObjections.length).toBeGreaterThan(0);
  });

  it("heightens price / value when price sensitivity is high (scenario label)", () => {
    const c: NegotiationSimulatorContext = { priceSensitivity: "high" };
    const f = forecastObjectionPath(c);
    const row = f.likelyObjections.find((o) => /price|value/i.test(o.type));
    expect(row?.probabilityBand).toBe("high");
  });
});
