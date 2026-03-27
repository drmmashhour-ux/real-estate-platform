import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { resolveTaxFlagsForPaymentType } from "@/lib/finance/payment-type-tax";

function settings(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "default",
    legalName: null,
    platformGstNumber: null,
    platformQstNumber: null,
    defaultGstRate: new Prisma.Decimal("0.05"),
    defaultQstRate: new Prisma.Decimal("0.09975"),
    applyTaxToPlatformServices: true,
    applyTaxToBrokerCommissions: true,
    paymentTypeTaxOverrides: null,
    investmentFeaturesEnabled: false,
    updatedAt: new Date(),
    ...overrides,
  } as import("@prisma/client").PlatformFinancialSettings;
}

describe("resolveTaxFlagsForPaymentType", () => {
  it("uses global toggles when no per-type override", () => {
    const r = resolveTaxFlagsForPaymentType({
      settings: settings({ applyTaxToPlatformServices: false, applyTaxToBrokerCommissions: true }),
      paymentType: "booking",
    });
    expect(r.applyTaxToPlatformServices).toBe(false);
    expect(r.applyTaxToBrokerCommissions).toBe(true);
  });

  it("applies per payment_type JSON overrides", () => {
    const r = resolveTaxFlagsForPaymentType({
      settings: settings({
        applyTaxToPlatformServices: true,
        applyTaxToBrokerCommissions: true,
        paymentTypeTaxOverrides: { subscription: { taxBroker: false, taxPlatform: true } },
      }),
      paymentType: "subscription",
    });
    expect(r.applyTaxToPlatformServices).toBe(true);
    expect(r.applyTaxToBrokerCommissions).toBe(false);
  });

  it("payment taxOverrideJson wins last", () => {
    const r = resolveTaxFlagsForPaymentType({
      settings: settings({
        paymentTypeTaxOverrides: { lead_unlock: { taxPlatform: true, taxBroker: true } },
      }),
      paymentType: "lead_unlock",
      taxOverrideJson: { applyTaxToBrokerCommissions: false },
    });
    expect(r.applyTaxToBrokerCommissions).toBe(false);
    expect(r.applyTaxToPlatformServices).toBe(true);
  });
});
