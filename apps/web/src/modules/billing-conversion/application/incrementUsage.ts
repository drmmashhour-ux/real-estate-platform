import type { ConversionFeatureKey } from "@/src/modules/billing-conversion/domain/billing.enums";
import { incrementUsageForFeature } from "@/src/modules/billing-conversion/infrastructure/usageRepository";

export async function incrementUsage(userId: string, feature: ConversionFeatureKey) {
  return incrementUsageForFeature(userId, feature);
}
