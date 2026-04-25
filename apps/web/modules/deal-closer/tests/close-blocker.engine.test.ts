import { describe, expect, it } from "vitest";
import { detectCloseBlockers } from "../close-blocker.engine";
import type { DealCloserContext } from "../deal-closer.types";

describe("detectCloseBlockers", () => {
  it("detects price and financing", () => {
    const b = detectCloseBlockers({
      objections: { objections: [{ type: "price", severity: "high", confidence: 0.7 }] },
      financingReadiness: "weak",
    } as DealCloserContext);
    expect(b.some((x) => x.key === "unresolved_price_objection")).toBe(true);
    expect(b.some((x) => x.key === "financing_uncertainty")).toBe(true);
  });

  it("returns no_strong_blocker when context is empty", () => {
    const b = detectCloseBlockers({} as DealCloserContext);
    expect(b.length).toBeGreaterThan(0);
  });
});
