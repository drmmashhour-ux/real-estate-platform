import { OACIQ_VIA_MESSAGES } from "@/lib/compliance/oaciq/verify-inform-advise/messages";
import { MIN_COMPARABLES_FOR_PRICE_ADVICE } from "@/lib/compliance/oaciq/verify-inform-advise/rule-engines";

export type OaciqViaRiskLevel = "low" | "medium" | "high";

export type OaciqViaSnapshot = {
  /** Retrieved / cited sources available for this output */
  verificationSourcesCount: number;
  sourceCoverageSufficient: boolean;
  requiredReviewOpen: boolean;
  /** Broker workflow: identity, contract, declarations, etc. */
  workflowComplete?: boolean;
  comparableCount?: number;
  marketContextPresent?: boolean;
  propertyCharacteristicsPresent?: boolean;
};

export type OaciqViaEvaluation = {
  riskLevel: OaciqViaRiskLevel;
  /** When false, downstream copy must not be framed as broker “advice”. */
  advicePermitted: boolean;
  verifyPhaseComplete: boolean;
  informPhaseAllowed: boolean;
  warningsEn: string[];
  warningsFr: string[];
  auditTags: string[];
};

export function evaluateOaciqVia(input: OaciqViaSnapshot): OaciqViaEvaluation {
  const warningsEn: string[] = [];
  const warningsFr: string[] = [];
  const auditTags: string[] = [];

  const thinVerification =
    input.verificationSourcesCount <= 0 ||
    !input.sourceCoverageSufficient ||
    input.requiredReviewOpen;

  if (thinVerification) {
    warningsEn.push(OACIQ_VIA_MESSAGES.verifyBeforeAdviceEn);
    warningsFr.push(OACIQ_VIA_MESSAGES.verifyBeforeAdviceFr);
    auditTags.push("missing_verification");
  }

  let riskLevel: OaciqViaRiskLevel = "low";
  if (thinVerification) {
    riskLevel = "high";
  } else if (
    input.workflowComplete === false ||
    input.comparableCount === 0 ||
    input.propertyCharacteristicsPresent === false
  ) {
    riskLevel = "medium";
    auditTags.push("incomplete_data");
  }

  const verifyPhaseComplete = !thinVerification;
  const advicePermitted = verifyPhaseComplete && !input.requiredReviewOpen && input.workflowComplete !== false;
  const informPhaseAllowed = verifyPhaseComplete || input.verificationSourcesCount > 0;

  if (!advicePermitted) {
    auditTags.push("advice_blocked");
  }

  return {
    riskLevel,
    advicePermitted,
    verifyPhaseComplete,
    informPhaseAllowed,
    warningsEn,
    warningsFr,
    auditTags,
  };
}

export function evaluatePricingAdviceGate(input: {
  comparableCount: number;
  marketContextPresent?: boolean;
  propertyCharacteristicsPresent?: boolean;
}): {
  pricingAdviceBlocked: boolean;
  messageEn: string;
  messageFr: string;
} {
  const ok =
    input.comparableCount >= MIN_COMPARABLES_FOR_PRICE_ADVICE &&
    (input.marketContextPresent !== false) &&
    (input.propertyCharacteristicsPresent !== false);

  if (ok) {
    return { pricingAdviceBlocked: false, messageEn: "", messageFr: "" };
  }

  return {
    pricingAdviceBlocked: true,
    messageEn: OACIQ_VIA_MESSAGES.pricingNoCompsEn,
    messageFr: OACIQ_VIA_MESSAGES.pricingNoCompsFr,
  };
}
