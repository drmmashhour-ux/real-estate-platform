import type { GreenProgramTier } from "./green.types";
import { greenCertificationLog } from "./green-logger";

const INTERNAL_CERT_MIN_SCORE = 72;

export type CertificationDecision = {
  eligible: boolean;
  label: string;
  reason: string;
};

/** Public badge copy — always clarifies internal methodology. */
export const LECIPM_GREEN_CERTIFIED_LABEL = "LECIPM Green Certified (internal score)";

/**
 * Premium tier unlocks automated certification timestamp when score clears threshold.
 * Free/basic stays educational — encourage upgrade for badge + marketplace priority.
 */
export function evaluateGreenCertificationEligibility(args: {
  internalScore: number;
  tier: GreenProgramTier;
}): CertificationDecision {
  if (args.tier === "none") {
    return {
      eligible: false,
      label: LECIPM_GREEN_CERTIFIED_LABEL,
      reason: "Activate the Green Upgrade Program (premium) for certification plus marketplace priority.",
    };
  }

  if (args.tier === "free") {
    return {
      eligible: false,
      label: LECIPM_GREEN_CERTIFIED_LABEL,
      reason:
        "Free tier includes orientation suggestions only — upgrade to premium for certification and browse boost.",
    };
  }

  const eligible = args.internalScore >= INTERNAL_CERT_MIN_SCORE;

  greenCertificationLog.info("certification_evaluated", {
    eligible,
    tier: args.tier,
    score: args.internalScore,
  });

  return {
    eligible,
    label: LECIPM_GREEN_CERTIFIED_LABEL,
    reason: eligible
      ? "Eligible for LECIPM Green Certified (internal score). Not an official government eco-label."
      : `Reach internal score ${INTERNAL_CERT_MIN_SCORE}+ based on modeled upgrades.`,
  };
}
