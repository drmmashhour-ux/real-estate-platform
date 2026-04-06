import { describe, expect, it } from "vitest";
import { calculateFees } from "@/lib/payments/utils/fees";

describe("calculateFees", () => {
  it("splits 10% guest + 3% host platform take from gross", () => {
    const r = calculateFees(10_000);
    expect(r.guestFeeCents).toBe(1000);
    expect(r.hostFeeCents).toBe(300);
    expect(r.platformFeeCents).toBe(1300);
    expect(r.hostAmountCents).toBe(8700);
  });

  it("handles zero", () => {
    const r = calculateFees(0);
    expect(r.platformFeeCents).toBe(0);
    expect(r.hostAmountCents).toBe(0);
  });
});
