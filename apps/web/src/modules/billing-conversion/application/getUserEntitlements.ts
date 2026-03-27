import type { ConversionPlanCode } from "@/src/modules/billing-conversion/domain/billing.enums";
import { getAllEntitlementsForPlan } from "@/src/modules/billing-conversion/infrastructure/entitlementService";

export async function getUserEntitlements(planCode: ConversionPlanCode) {
  return getAllEntitlementsForPlan(planCode);
}
