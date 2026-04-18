import type { TrustEvaluation, TrustRiskLevel } from "./trust.types";

function bandFromResidualRisk(risk01: number): TrustRiskLevel {
  if (risk01 >= 0.75) return "critical";
  if (risk01 >= 0.5) return "high";
  if (risk01 >= 0.28) return "medium";
  return "low";
}

/**
 * User trust — observable account signals only (Law 25: minimize data in explanations).
 */
export function scoreUserTrust(input: {
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  accountAgeDays: number;
  incidentReportsAgainst: number;
  completedPayments: number;
}): TrustEvaluation {
  let score = 42;
  const explanation: string[] = ["base=42 (neutral prior)"];

  if (input.emailVerified) {
    score += 12;
    explanation.push("+12 email verified");
  }
  if (input.phoneVerified) {
    score += 10;
    explanation.push("+10 phone verified");
  }
  if (input.identityVerified) {
    score += 18;
    explanation.push("+18 identity verification complete");
  }
  if (input.accountAgeDays > 30) {
    score += 6;
    explanation.push("+6 account age > 30d");
  } else {
    explanation.push("newer account — wider uncertainty");
  }
  score -= Math.min(35, input.incidentReportsAgainst * 12);
  if (input.incidentReportsAgainst > 0) explanation.push("- risk from reported incidents (internal triage)");
  score += Math.min(8, Math.floor(input.completedPayments / 3));
  if (input.completedPayments > 0) explanation.push("+ payment history present");

  const s = Math.max(0, Math.min(100, score));
  const residualRisk = Math.max(0, 1 - s / 100);
  const confidence =
    input.emailVerified && input.identityVerified ? 0.78 : input.emailVerified ? 0.55 : 0.38;

  return {
    score: s,
    confidence,
    riskLevel: bandFromResidualRisk(residualRisk),
    explanation,
  };
}

/**
 * FSBO listing trust — combines platform scores + completeness heuristics.
 */
export function scoreFsboListingTrust(input: {
  trustScore: number | null;
  riskScore: number | null;
  imageCount: number;
  descriptionLen: number;
  moderationStatus: string;
}): TrustEvaluation {
  const t = input.trustScore ?? 50;
  const r = input.riskScore ?? 35;
  let score = Math.round(t * 0.55 + (100 - r) * 0.45);
  const explanation: string[] = [
    `blended platform trust=${input.trustScore ?? "n/a"} and inverse risk=${input.riskScore ?? "n/a"}`,
  ];

  if (input.imageCount >= 6) {
    score += 4;
    explanation.push("+4 image depth");
  } else if (input.imageCount < 3) {
    score -= 8;
    explanation.push("-8 few images");
  }
  if (input.descriptionLen > 200) {
    score += 3;
    explanation.push("+3 description depth");
  }

  if (input.moderationStatus === "PENDING") {
    explanation.push("moderation pending — confidence reduced");
  }

  const s = Math.max(0, Math.min(100, score));
  const confidence = input.trustScore != null && input.riskScore != null ? 0.72 : 0.45;
  const residualRisk = r / 100;

  return {
    score: s,
    confidence,
    riskLevel: bandFromResidualRisk(residualRisk),
    explanation,
  };
}
