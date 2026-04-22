import { describe, expect, it } from "vitest";

import { calculateMonthlyResidentialTotal } from "../soins-pricing-engine.service";
import { FAMILY_ADDON_LIST_PRICES, MONITORING_ADDON_LIST_PRICES } from "../soins-revenue-catalog";

describe("calculateMonthlyResidentialTotal", () => {
  it("sums base + care + food + services + family + monitoring + diet", () => {
    const r = calculateMonthlyResidentialTotal({
      baseResidencePrice: 2500,
      residenceTier: "ASSISTED",
      careTier: "ASSISTED",
      foodTier: "FULL",
      selectedServicePrices: [100, 50],
      familyAddons: {
        CAMERA_ACCESS: true,
        ADVANCED_ALERTS: true,
      },
      monitoringAddons: {
        STANDARD_OPS_MONITORING: true,
      },
      specialDietSurcharge: 40,
    });

    const expected =
      2500 +
      400 + // residence ASSISTED
      850 + // care ASSISTED
      780 + // food FULL
      40 + // diet
      150 + // services
      FAMILY_ADDON_LIST_PRICES.CAMERA_ACCESS +
      FAMILY_ADDON_LIST_PRICES.ADVANCED_ALERTS +
      MONITORING_ADDON_LIST_PRICES.STANDARD_OPS_MONITORING;

    expect(r.monthlyTotal).toBe(Math.round(expected * 100) / 100);
    expect(r.breakdown.some((b) => b.code === "RESIDENCE_TIER")).toBe(true);
    expect(r.breakdown.some((b) => b.code === "SPECIAL_DIET")).toBe(true);
  });

  it("supports food NONE and no optional tiers", () => {
    const r = calculateMonthlyResidentialTotal({
      baseResidencePrice: 1800,
      careTier: "INDEPENDENT",
      foodTier: "NONE",
      selectedServicePrices: [],
      familyAddons: {},
      monitoringAddons: {},
    });
    expect(r.monthlyTotal).toBe(1800);
  });

  it("includes ONE_MEAL food tier and all family addon keys when enabled", () => {
    const allFamily: Record<string, boolean> = {};
    for (const k of Object.keys(FAMILY_ADDON_LIST_PRICES) as Array<keyof typeof FAMILY_ADDON_LIST_PRICES>) {
      allFamily[k] = true;
    }
    const r = calculateMonthlyResidentialTotal({
      baseResidencePrice: 1000,
      careTier: "MEMORY_CARE",
      foodTier: "ONE_MEAL",
      selectedServicePrices: [],
      familyAddons: allFamily,
      monitoringAddons: {},
    });

    let familySum = 0;
    for (const v of Object.values(FAMILY_ADDON_LIST_PRICES)) familySum += v;

    expect(r.monthlyTotal).toBe(
      Math.round((1000 + 1650 + 320 + familySum) * 100) / 100,
    );
  });
});
