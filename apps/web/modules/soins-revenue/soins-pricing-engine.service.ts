import type {
  MonthlyPricingInput,
  MonthlyPricingResult,
  SoinsCareTier,
  SoinsFoodTier,
  SoinsFamilyAddonKey,
  SoinsMonitoringAddonKey,
  SoinsResidenceTier,
} from "./soins-revenue.types";
import { FAMILY_ADDON_LIST_PRICES, MONITORING_ADDON_LIST_PRICES } from "./soins-revenue-catalog";

/** Monthly uplift by clinical care package tier (CAD-style units; caller sets currency display). */
const CARE_TIER_MONTHLY: Record<SoinsCareTier, number> = {
  INDEPENDENT: 0,
  ASSISTED: 850,
  MEMORY_CARE: 1650,
  SKILLED: 2400,
};

/** Bed / program base uplift by residence facility tier (optional multi-axis pricing). */
const RESIDENCE_TIER_MONTHLY: Record<SoinsResidenceTier, number> = {
  INDEPENDENT: 0,
  ASSISTED: 400,
  MEDICAL: 900,
};

const FOOD_TIER_MONTHLY: Record<SoinsFoodTier, number> = {
  NONE: 0,
  ONE_MEAL: 320,
  FULL: 780,
};

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

/**
 * Flexible recurring monthly quote for a resident placement:
 * base + care + food + à-la-carte services + family add-ons + monitoring add-ons.
 */
export function calculateMonthlyResidentialTotal(input: MonthlyPricingInput): MonthlyPricingResult {
  const breakdown: MonthlyPricingResult["breakdown"] = [];

  breakdown.push({
    code: "BASE_RESIDENCE",
    label: "Base residence / unit",
    amount: round2(input.baseResidencePrice),
  });

  if (input.residenceTier) {
    const rt = residenceTierMonthlyUplift(input.residenceTier);
    breakdown.push({
      code: "RESIDENCE_TIER",
      label: `Residence tier (${input.residenceTier})`,
      amount: round2(rt),
    });
  }

  const care = CARE_TIER_MONTHLY[input.careTier];
  breakdown.push({
    code: "CARE_LEVEL",
    label: `Care package (${input.careTier})`,
    amount: round2(care),
  });

  const food = FOOD_TIER_MONTHLY[input.foodTier];
  breakdown.push({
    code: "FOOD_PLAN",
    label: `Food plan (${input.foodTier})`,
    amount: round2(food),
  });

  const diet = round2(Math.max(0, input.specialDietSurcharge ?? 0));
  if (diet > 0) {
    breakdown.push({
      code: "SPECIAL_DIET",
      label: "Special diet surcharge",
      amount: diet,
    });
  }

  let svcSum = 0;
  input.selectedServicePrices.forEach((p, i) => {
    const amt = round2(p);
    svcSum += amt;
    breakdown.push({
      code: `SERVICE_${i + 1}`,
      label: `Service add-on ${i + 1}`,
      amount: amt,
    });
  });

  let familySum = 0;
  for (const key of Object.keys(FAMILY_ADDON_LIST_PRICES) as SoinsFamilyAddonKey[]) {
    if (input.familyAddons[key]) {
      const amt = FAMILY_ADDON_LIST_PRICES[key];
      familySum += amt;
      breakdown.push({
        code: `FAMILY_${key}`,
        label: `Family add-on · ${key}`,
        amount: round2(amt),
      });
    }
  }

  let monSum = 0;
  for (const key of Object.keys(MONITORING_ADDON_LIST_PRICES) as SoinsMonitoringAddonKey[]) {
    if (input.monitoringAddons[key]) {
      const amt = MONITORING_ADDON_LIST_PRICES[key];
      monSum += amt;
      breakdown.push({
        code: `MONITORING_${key}`,
        label: `Monitoring · ${key}`,
        amount: round2(amt),
      });
    }
  }

  const monthlyTotal = round2(
    breakdown.reduce((s, row) => s + row.amount, 0),
  );

  return { monthlyTotal, breakdown };
}

/** Optional second axis when pricing uses both facility type and care tier separately. */
export function residenceTierMonthlyUplift(tier: SoinsResidenceTier): number {
  return RESIDENCE_TIER_MONTHLY[tier];
}

export function foodTierMonthlyAmount(tier: SoinsFoodTier): number {
  return FOOD_TIER_MONTHLY[tier];
}

export function careTierMonthlyAmount(tier: SoinsCareTier): number {
  return CARE_TIER_MONTHLY[tier];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
