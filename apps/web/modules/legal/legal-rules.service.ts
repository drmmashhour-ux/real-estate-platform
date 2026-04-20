/**
 * Broker protection / diligence evaluation — deterministic, template-based reasoning (not legal advice).
 */

export type BrokerEvaluationInput = {
  brokerDisclosedSource: boolean;
  attemptedVerification: boolean;
  disclosureWarningIssued: boolean;
  sellerUncooperative: boolean;
  forwardedSellerInfoWithoutWarning: boolean;
  forwardedWithoutVerificationAttempt: boolean;
};

export type BrokerEvaluationResult = {
  brokerProtected: boolean;
  brokerRiskScore: number;
  /** 0–100 interpretive reduction when seller non-cooperation reduces broker exposure. */
  brokerFaultProbabilityReduction: number;
  reasoning: string;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function evaluateBrokerProtection(input: BrokerEvaluationInput): BrokerEvaluationResult {
  const lines: string[] = [];
  let brokerRiskScore = 0;
  let brokerFaultProbabilityReduction = 0;

  const diligenceTriad =
    input.brokerDisclosedSource && input.attemptedVerification && input.disclosureWarningIssued;

  let brokerProtected = false;
  if (diligenceTriad) {
    brokerProtected = true;
    lines.push(
      "Broker protection: source was disclosed to the buyer, reasonable verification was attempted, and a disclosure warning was issued.",
    );
  }

  if (input.sellerUncooperative) {
    brokerFaultProbabilityReduction = 25;
    lines.push(
      "Seller cooperation risk: seller marked uncooperative; broker fault probability reduced by 25 points for diligence assessment.",
    );
  }

  const forwardedWithoutCare =
    input.forwardedSellerInfoWithoutWarning && input.forwardedWithoutVerificationAttempt;
  if (forwardedWithoutCare) {
    brokerProtected = false;
    brokerRiskScore += 45;
    lines.push(
      "Broker diligence gap: seller statements were forwarded without warning and without a documented verification attempt; broker protection does not apply and broker risk is elevated.",
    );
  } else if (input.forwardedSellerInfoWithoutWarning) {
    brokerProtected = false;
    brokerRiskScore += 22;
    lines.push(
      "Broker diligence gap: seller information was forwarded without an explicit buyer-facing disclosure warning.",
    );
  } else if (input.forwardedWithoutVerificationAttempt) {
    brokerProtected = false;
    brokerRiskScore += 28;
    lines.push("Broker diligence gap: no documented verification attempt before relaying seller representations.");
  }

  if (!diligenceTriad && !forwardedWithoutCare && brokerRiskScore === 0) {
    lines.push(
      "Broker diligence neutral: insufficient signals to assert full broker protection; review verification logs and disclosure warnings.",
    );
  }

  brokerRiskScore = clamp(brokerRiskScore, 0, 100);

  return {
    brokerProtected,
    brokerRiskScore,
    brokerFaultProbabilityReduction,
    reasoning: lines.join(" "),
  };
}
