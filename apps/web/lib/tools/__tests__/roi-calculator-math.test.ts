import { describe, expect, it } from "vitest";
import {
  computeRoiCalculatorMetrics,
  monthlyMortgagePayment,
} from "@/lib/tools/roi-calculator-math";

describe("monthlyMortgagePayment", () => {
  it("returns 0 for invalid inputs", () => {
    expect(monthlyMortgagePayment(-1, 5, 25)).toBe(0);
    expect(monthlyMortgagePayment(100_000, 5, 0)).toBe(0);
    expect(monthlyMortgagePayment(Number.NaN, 5, 25)).toBe(0);
  });

  it("handles zero interest as straight division", () => {
    const pmt = monthlyMortgagePayment(120_000, 0, 25);
    expect(pmt).toBeCloseTo(120_000 / (25 * 12), 5);
  });

  it("matches a known amortization ballpark", () => {
    const pmt = monthlyMortgagePayment(400_000, 5.25, 25);
    expect(pmt).toBeGreaterThan(2000);
    expect(pmt).toBeLessThan(3000);
  });
});

describe("computeRoiCalculatorMetrics", () => {
  it("returns null yields when price is non-positive", () => {
    const m = computeRoiCalculatorMetrics({
      price: 0,
      monthlyRent: 2000,
      monthlyExpenses: 400,
      downPct: 20,
      ratePct: 5,
      amortYears: 25,
    });
    expect(m.grossYield).toBeNull();
    expect(m.capRate).toBeNull();
    expect(m.cashOnCash).toBeNull();
  });

  it("computes gross yield and cap rate for typical inputs", () => {
    const m = computeRoiCalculatorMetrics({
      price: 500_000,
      monthlyRent: 2500,
      monthlyExpenses: 500,
      downPct: 20,
      ratePct: 5.25,
      amortYears: 25,
    });
    expect(m.grossYield).not.toBeNull();
    expect(m.grossYield!).toBeCloseTo(6, 1);
    expect(m.capRate).not.toBeNull();
    expect(m.annualNoi).toBe(2500 * 12 - 500 * 12);
  });

  it("clamps down percent to 0–100", () => {
    const m = computeRoiCalculatorMetrics({
      price: 400_000,
      monthlyRent: 2000,
      monthlyExpenses: 400,
      downPct: 150,
      ratePct: 5,
      amortYears: 25,
    });
    expect(m.cashDown).toBe(400_000);
  });
});
