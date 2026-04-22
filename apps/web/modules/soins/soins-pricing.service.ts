import type { CareLevel } from "@prisma/client";

import {
  type MonthlyPricingInput,
  type MonthlyPricingResult,
  careLevelMeetsRequired,
} from "./soins.types";

/** Multiplier on base rent by clinical tier (tunable). */
const CARE_BASE_MULT: Record<CareLevel, number> = {
  INDEPENDENT: 1,
  ASSISTED: 1.12,
  MEMORY_CARE: 1.22,
  SKILLED: 1.35,
};

/**
 * Operator-configured monthly estimate: base (unit or residence) × care tier,
 * plus food plan and eligible add-on services.
 */
export function calculateMonthlyCost(input: MonthlyPricingInput): MonthlyPricingResult {
  const mult = CARE_BASE_MULT[input.careLevel] ?? 1;
  const careLevelAdjustedBase = Math.round(input.basePrice * mult * 100) / 100;

  const eligible = input.services.filter((s) => careLevelMeetsRequired(input.careLevel, s.requiredLevel));
  const subtotalServices = Math.round(eligible.reduce((s, x) => s + x.price, 0) * 100) / 100;

  const foodPlanAdd = input.foodPlan ? Math.round(input.foodPlan.price * 100) / 100 : 0;

  const breakdown: MonthlyPricingResult["breakdown"] = [
    { label: `Adjusted base (${input.careLevel})`, amount: careLevelAdjustedBase },
  ];
  if (input.foodPlan) {
    breakdown.push({
      label: `Food (${input.foodPlan.name}, ${input.foodPlan.mealsPerDay}/day)`,
      amount: foodPlanAdd,
    });
  }
  for (const svc of eligible) {
    breakdown.push({ label: svc.name, amount: svc.price });
  }

  const totalMonthly =
    Math.round((careLevelAdjustedBase + foodPlanAdd + subtotalServices) * 100) / 100;

  return {
    careLevelAdjustedBase,
    foodPlanAdd,
    subtotalServices,
    totalMonthly,
    breakdown,
  };
}
