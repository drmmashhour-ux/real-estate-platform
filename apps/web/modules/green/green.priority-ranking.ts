import type { GreenProgramTier } from "./green.types";
import { greenSystemLog } from "./green-logger";

export type GreenBrowseBoostInput = {
  /** sortAt used by buyer browse (large magnitude) */
  sortAt: number;
  internalScore: number | null;
  certifiedAt: Date | null;
  tier: GreenProgramTier;
  /** AI band — GREEN gets extra discovery lift when paired with verification signals */
  aiLabel?: string | null;
  verificationLevel?: string | null;
};

/**
 * Increments listing sort weight for AI green + verification + premium report signals.
 */
export function applyGreenPriorityBoost(input: GreenBrowseBoostInput): number {
  const { sortAt, internalScore, certifiedAt, tier, aiLabel, verificationLevel } = input;

  let multiplier = 1;
  if (tier === "premium" && certifiedAt != null) multiplier *= 1.12;
  else if (tier === "premium") multiplier *= 1.06;
  else if (tier === "free" && internalScore != null && internalScore >= 65) multiplier *= 1.025;
  else if (internalScore != null && internalScore >= 70) multiplier *= 1.015;

  if (verificationLevel === "DOCUMENT_SUPPORTED" || verificationLevel === "PROFESSIONAL_VERIFIED") {
    multiplier *= 1.06;
  }
  if (aiLabel === "GREEN") {
    multiplier *= 1.04;
  }

  const boosted = Math.round(sortAt * multiplier);
  if (multiplier > 1) {
    greenSystemLog.info("browse_boost_applied", {
      multiplier,
      tier,
      certified: Boolean(certifiedAt),
      verificationLevel: verificationLevel ?? null,
      aiLabel: aiLabel ?? null,
    });
  }
  return boosted;
}
