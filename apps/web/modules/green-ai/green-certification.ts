import type { GreenAiPerformanceLabel, GreenVerificationLevel } from "./green.types";
import { LECIPM_GREEN_AI_DISCLAIMER } from "./green.types";
import type { GreenProgramTier } from "@/modules/green/green.types";
import { certificationAiLog } from "./green-ai-logger";

export { LECIPM_GREEN_AI_DISCLAIMER };

/** Badge text — never implies government certification. */
export const LECIPM_GREEN_VERIFIED_BADGE = "🌱 LECIPM Green Verified";

/** Tooltip for badge — short trust layer + mandatory disclaimer */
export const LECIPM_GREEN_VERIFIED_TOOLTIP =
  "AI-based evaluation with optional document verification. " + LECIPM_GREEN_AI_DISCLAIMER;

export type CertificationView = {
  showBadge: boolean;
  badgeLabel: typeof LECIPM_GREEN_VERIFIED_BADGE;
  tooltip: string;
  aiGreenScore: number | null;
  verificationLevel: GreenVerificationLevel | null;
  confidence: number | null;
};

export function evaluateGreenVerifiedPresentation(args: {
  score: number | null;
  label: GreenAiPerformanceLabel | null;
  verificationLevel: GreenVerificationLevel | null;
  confidence: number | null;
  programTier: GreenProgramTier;
  premiumReportPurchased?: boolean;
}): CertificationView {
  const tierOk = args.programTier === "premium" || Boolean(args.premiumReportPurchased);
  const docBacked =
    args.verificationLevel === "DOCUMENT_SUPPORTED" || args.verificationLevel === "PROFESSIONAL_VERIFIED";
  const strongGreen = args.label === "GREEN" || (args.score ?? 0) >= 72;

  const showBadge =
    tierOk &&
    strongGreen &&
    (docBacked || (args.confidence ?? 0) >= 52);

  certificationAiLog.info("green_verified_badge_evaluated", {
    showBadge,
    tierOk,
    docBacked,
    score: args.score,
  });

  return {
    showBadge,
    badgeLabel: LECIPM_GREEN_VERIFIED_BADGE,
    tooltip: LECIPM_GREEN_VERIFIED_TOOLTIP,
    aiGreenScore: args.score,
    verificationLevel: args.verificationLevel,
    confidence: args.confidence,
  };
}
