/** Soins / care — mirrors Prisma care enums + models for shared modules and UI bundles. */

export type CareFoodPlanTier = "NONE" | "ONE_MEAL" | "FULL";

export type CareLevel = "INDEPENDENT" | "ASSISTED" | "MEMORY_CARE" | "SKILLED";

export type CareResidenceType = "INDEPENDENT" | "ASSISTED" | "MEDICAL";

export type CareServiceKind = "MEDICAL" | "DAILY_LIVING" | "SAFETY";

export type CareHubEventKind = "ALERT" | "HEALTH" | "MOVEMENT" | "EMERGENCY";

export type CareHubEventSeverity = "LOW" | "MEDIUM" | "HIGH";

export type CareService = {
  id: string;
  residenceId: string;
  name: string;
  type: CareServiceKind;
  price: number;
  requiredLevel: CareLevel;
};

export type FoodPlan = {
  id: string;
  residenceId: string;
  name: CareFoodPlanTier;
  mealsPerDay: number;
  price: number;
};
