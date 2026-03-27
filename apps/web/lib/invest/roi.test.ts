import { describe, expect, it } from "vitest";
import { computeRoi, monthlyMortgagePayment } from "./roi";

describe("monthlyMortgagePayment", () => {
  it("returns 0 for zero principal", () => {
    expect(monthlyMortgagePayment(0, 5, 25)).toBe(0);
  });

  it("matches rough amortization for sample loan", () => {
    const p = monthlyMortgagePayment(360_000, 5.5, 25);
    expect(p).toBeGreaterThan(2100);
    expect(p).toBeLessThan(2300);
  });
});

describe("computeRoi", () => {
  it("computes positive cash flow for simple rental", () => {
    const out = computeRoi({
      purchasePrice: 400_000,
      downPayment: 100_000,
      mortgageInterestRate: 5,
      amortizationYears: 25,
      monthlyRent: 2800,
      vacancyRatePercent: 5,
      propertyTaxAnnual: 3000,
      condoFeesAnnual: 2400,
      insuranceAnnual: 1000,
      managementAnnual: 0,
      repairsReserveAnnual: 1200,
      closingCosts: 5000,
      welcomeTax: 4000,
      otherMonthlyExpenses: 0,
      otherAnnualExpenses: 0,
    });
    expect(out.grossAnnualIncome).toBeGreaterThan(0);
    expect(out.capRatePercent).toBeGreaterThan(0);
    expect(out.loanAmount).toBe(300_000);
  });
});
