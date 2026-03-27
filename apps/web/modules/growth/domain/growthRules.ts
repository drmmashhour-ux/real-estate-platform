/** Stable trigger keys for idempotent growth emails. */

export const GrowthTriggerKey = {
  INACTIVE_3D_LISTING: "inactive_3d_listing",
  LISTING_INCOMPLETE: "listing_incomplete",
  HIGH_SCORE_NO_UPGRADE: "high_score_no_upgrade",
  ONBOARDING_NEW_USER: "onboarding_new_user",
} as const;

export type GrowthTriggerKeyType = (typeof GrowthTriggerKey)[keyof typeof GrowthTriggerKey];
