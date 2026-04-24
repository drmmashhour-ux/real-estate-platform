import type { LecipmTrustEngineTargetType } from "@prisma/client";

import type { TrustFactorGroup } from "./trust-score.types";

/** Auditable profile id — bump when changing economics of the model. */
export const TRUST_WEIGHT_PROFILE_VERSION = "v1";

/** Group multipliers by marketplace target — operational tuning, not punitive defaults. */
const GROUP_WEIGHTS: Record<
  LecipmTrustEngineTargetType,
  Record<TrustFactorGroup, number>
> = {
  BROKER: {
    COMPLIANCE_DOCUMENTATION: 1.25,
    RESPONSIVENESS_RELIABILITY: 1.35,
    BOOKING_NOSHOW: 1.05,
    DISPUTE_FRICTION: 1.45,
    LISTING_DEAL_QUALITY: 1.15,
    INSURANCE_COVERAGE: 1.2,
  },
  LISTING: {
    COMPLIANCE_DOCUMENTATION: 1.45,
    RESPONSIVENESS_RELIABILITY: 1.05,
    BOOKING_NOSHOW: 1.35,
    DISPUTE_FRICTION: 1.25,
    LISTING_DEAL_QUALITY: 1.5,
    INSURANCE_COVERAGE: 1.15,
  },
  DEAL: {
    COMPLIANCE_DOCUMENTATION: 1.35,
    RESPONSIVENESS_RELIABILITY: 1.25,
    BOOKING_NOSHOW: 0.95,
    DISPUTE_FRICTION: 1.35,
    LISTING_DEAL_QUALITY: 1.35,
    INSURANCE_COVERAGE: 1.1,
  },
  BOOKING: {
    COMPLIANCE_DOCUMENTATION: 1.05,
    RESPONSIVENESS_RELIABILITY: 1.25,
    BOOKING_NOSHOW: 1.55,
    DISPUTE_FRICTION: 1.35,
    LISTING_DEAL_QUALITY: 1.05,
    INSURANCE_COVERAGE: 1.05,
  },
  TERRITORY: {
    COMPLIANCE_DOCUMENTATION: 1.05,
    RESPONSIVENESS_RELIABILITY: 1.05,
    BOOKING_NOSHOW: 1.1,
    DISPUTE_FRICTION: 1.35,
    LISTING_DEAL_QUALITY: 1.25,
    INSURANCE_COVERAGE: 1.05,
  },
};

export function getGroupWeight(targetType: LecipmTrustEngineTargetType, group: TrustFactorGroup): number {
  return GROUP_WEIGHTS[targetType]?.[group] ?? 1;
}
