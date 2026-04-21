import type { RiskLevel } from "@/modules/messaging/autopilot/autopilot.types";

const PRICE_RE =
  /\$\s?\d|[\d,]+\s?\$|\b(price|pricing|offer|bid|counter|deposit|accepted|firm|sold for)\b|\b\d{3,6}\s?(k\b|cad|usd)/i;
const LEGAL_RE =
  /\b(contract|clause|lawyer|notary|promise to purchase|oaciq|declaration|litigation|warranty|easement)\b/i;
const NEGOTIATION_RE =
  /\b(negotiat|counteroffer|lower|discount|firm price|best offer|multiples|competing)\b/i;

export type RiskAssessment = {
  riskLevel: RiskLevel;
  flags: {
    pricing: boolean;
    legal: boolean;
    negotiation: boolean;
  };
};

export function assessIncomingMessageRisk(text: string): RiskAssessment {
  const t = text.trim();
  const pricing = PRICE_RE.test(t);
  const legal = LEGAL_RE.test(t);
  const negotiation = NEGOTIATION_RE.test(t);

  let riskLevel: RiskLevel = "LOW";
  if (legal || negotiation) riskLevel = "HIGH";
  else if (pricing) riskLevel = "MEDIUM";

  return {
    riskLevel,
    flags: { pricing, legal, negotiation },
  };
}

/** LOW risk heuristics: greetings, scheduling, generic info — already implied by absence of flags */
export function isEligibleForLowRiskAutoSend(assessment: RiskAssessment): boolean {
  return assessment.riskLevel === "LOW" && !assessment.flags.pricing && !assessment.flags.legal && !assessment.flags.negotiation;
}
