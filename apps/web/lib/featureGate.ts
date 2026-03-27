import { getSubscriptionEntitlements } from "@/modules/billing/getPlanEntitlements";

export class FeatureNotAvailableError extends Error {
  readonly code = "FEATURE_NOT_AVAILABLE" as const;

  constructor(feature: string) {
    super(`Feature not available: ${feature}`);
    this.name = "FeatureNotAvailableError";
  }
}

const BOOLEAN_FEATURES = new Set(["copilot", "advancedAnalytics", "premiumPlacement"]);

/**
 * Throws {@link FeatureNotAvailableError} when the user/workspace does not have the feature.
 * For numeric limits (e.g. max listings), use {@link getSubscriptionEntitlements} and compare in the caller.
 */
export async function requireFeature(input: {
  userId?: string;
  workspaceId?: string;
  feature: string;
}): Promise<void> {
  const entitlements = await getSubscriptionEntitlements({
    userId: input.userId,
    workspaceId: input.workspaceId,
  });

  if (!BOOLEAN_FEATURES.has(input.feature)) {
    throw new FeatureNotAvailableError(input.feature);
  }

  const key = input.feature as keyof typeof entitlements.features;
  const allowed = entitlements.features[key];
  if (typeof allowed !== "boolean" || !allowed) {
    throw new FeatureNotAvailableError(input.feature);
  }
}
