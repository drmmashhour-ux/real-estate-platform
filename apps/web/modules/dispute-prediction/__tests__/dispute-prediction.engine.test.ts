import { describe, expect, it } from "vitest";

import { inferPredictedCategory } from "../dispute-prediction.engine";
import type { RiskSignal } from "@/modules/risk-engine/risk.types";

function sig(
  id: RiskSignal["id"],
  weight: number,
  source: RiskSignal["source"] = "booking"
): RiskSignal {
  return {
    id,
    weight,
    source,
    evidence: "test",
    observedAt: new Date().toISOString(),
  };
}

describe("inferPredictedCategory", () => {
  it("prefers payment_delay when dominant", () => {
    expect(inferPredictedCategory([sig("payment_delay", 40), sig("booking_no_confirmation", 10)])).toBe(
      "PAYMENT_FRICTION"
    );
  });

  it("maps negotiation stall", () => {
    expect(inferPredictedCategory([sig("negotiation_stall", 30)])).toBe("NEGOTIATION_BREAKDOWN");
  });

  it("falls back to OTHER", () => {
    expect(inferPredictedCategory([sig("autopilot_execution_friction", 5)])).toBe("OTHER");
  });
});
