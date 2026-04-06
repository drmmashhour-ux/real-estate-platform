import { describe, it, expect } from "vitest";
import { getBnhubBookingEngine, getBnhubPricingEngine } from "../bnhub-adapter";

describe("bnhub adapter", () => {
  it("exposes booking and pricing engines", () => {
    const b = getBnhubBookingEngine();
    const p = getBnhubPricingEngine();
    expect(typeof b.computeQuote).toBe("function");
    expect(typeof b.validateAvailability).toBe("function");
    expect(typeof p.price).toBe("function");
  });
});
