import type { ConversionFeatureKey, ConversionPlanCode } from "@/src/modules/billing-conversion/domain/billing.enums";

export type UserPlanResolution = {
  planCode: ConversionPlanCode;
  source: "subscription" | "legacy_user_plan" | "default";
};

export type UsageLimitCheckResult = {
  allowed: boolean;
  remaining: number | null;
  limitReached: boolean;
  currentPlan: string;
  upgradeRequired: boolean;
  limit: number | null;
  feature: ConversionFeatureKey;
};
