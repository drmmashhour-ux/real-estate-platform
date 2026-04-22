import type {
  CareFoodPlanTier,
  CareHubEventKind,
  CareHubEventSeverity,
  CareLevel,
  CareResidenceType,
  CareService,
  CareServiceKind,
  FoodPlan,
} from "@prisma/client";

export type {
  CareFoodPlanTier,
  CareHubEventKind,
  CareHubEventSeverity,
  CareLevel,
  CareResidenceType,
  CareServiceKind,
};

/** Monotonic rank for care tier comparisons (pricing + service eligibility). */
export const CARE_LEVEL_RANK: Record<CareLevel, number> = {
  INDEPENDENT: 0,
  ASSISTED: 1,
  MEMORY_CARE: 2,
  SKILLED: 3,
};

export function careLevelMeetsRequired(residentLevel: CareLevel, required: CareLevel): boolean {
  return CARE_LEVEL_RANK[residentLevel] >= CARE_LEVEL_RANK[required];
}

export type MonthlyPricingInput = {
  basePrice: number;
  careLevel: CareLevel;
  foodPlan: Pick<FoodPlan, "price" | "name" | "mealsPerDay"> | null;
  services: Pick<CareService, "name" | "price" | "requiredLevel">[];
};

export type MonthlyPricingResult = {
  subtotalServices: number;
  careLevelAdjustedBase: number;
  foodPlanAdd: number;
  totalMonthly: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
};

export type SoinsViewerRole = "admin" | "resident" | "family" | "operator";

export type SoinsViewerContext =
  | { role: "admin" }
  | { role: "resident"; residentId: string }
  | { role: "family"; residentId: string; familyUserId: string }
  | { role: "operator"; residenceId: string };
