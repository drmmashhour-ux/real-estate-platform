/**
 * Deterministic legal risk scoring (no LLM). Used for compliance hints and audit trails only — not legal advice.
 */

export type LegalRiskEngineInput = {
  roofConditionUnknown?: boolean;
  highValueProperty?: boolean;
  sellerProvidedInfo?: boolean;
  incompleteDisclosure?: boolean;
  inspectionLimited?: boolean;
  sellerSilenceDuringInspection?: boolean;
  /** Phase 7 — broker protection */
  brokerDisclosedSource?: boolean;
  attemptedVerification?: boolean;
  /** Phase 7 — seller bad faith */
  knownDefect?: boolean;
  notDisclosed?: boolean;
  /** Phase 7 — latent defect pattern */
  hiddenDefect?: boolean;
  serious?: boolean;
  priorToSale?: boolean;
};

export type LegalRiskEngineResult = {
  score: number;
  riskLevel: "MEDIUM" | "HIGH" | "CRITICAL";
  flags: string[];
  /** True when broker protection rule applies (reduced broker liability exposure). */
  brokerProtectionApplied: boolean;
  badFaith: boolean;
  latentDefectIndicated: boolean;
};

const MAX_SCORE = 100;

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(MAX_SCORE, Math.max(0, n));
}

/**
 * Evaluates stacked rules in a fixed order for reproducible outputs.
 */
export function evaluateLegalRisk(input: LegalRiskEngineInput): LegalRiskEngineResult {
  let score = 0;
  const flags: string[] = [];
  const pushFlag = (f: string) => {
    if (!flags.includes(f)) flags.push(f);
  };

  if (input.roofConditionUnknown && input.highValueProperty) {
    score += 30;
    pushFlag("POTENTIAL_LATENT_DEFECT");
  }

  if (input.sellerProvidedInfo && input.incompleteDisclosure) {
    score += 40;
    pushFlag("MISREPRESENTATION_RISK");
  }

  if (input.inspectionLimited) {
    score += 20;
    pushFlag("INSPECTION_LIMITATION");
  }

  if (input.sellerSilenceDuringInspection) {
    score += 50;
    pushFlag("BAD_FAITH_BEHAVIOR");
  }

  let badFaith = false;
  if (input.knownDefect === true && input.notDisclosed === true) {
    badFaith = true;
    score += 50;
    pushFlag("BAD_FAITH_NON_DISCLOSURE");
  }

  let latentDefectIndicated = false;
  if (input.hiddenDefect === true && input.serious === true && input.priorToSale === true) {
    latentDefectIndicated = true;
    pushFlag("LATENT_DEFECT_PATTERN");
    score += 25;
  }

  let brokerProtectionApplied = false;
  if (input.brokerDisclosedSource === true && input.attemptedVerification === true) {
    brokerProtectionApplied = true;
    pushFlag("BROKER_PROTECTION_RULE");
  }

  score = clampScore(score);

  const riskLevel: LegalRiskEngineResult["riskLevel"] =
    score > 80 ? "CRITICAL" : score > 50 ? "HIGH" : "MEDIUM";

  return {
    score,
    riskLevel,
    flags,
    brokerProtectionApplied,
    badFaith,
    latentDefectIndicated,
  };
}

export const LEGAL_RISK_ALERT_MESSAGE =
  "⚠️ Legal Risk Detected: Potential misrepresentation or latent defect";

export function legalRiskAlertMessage(result: Pick<LegalRiskEngineResult, "riskLevel">): string | null {
  if (result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") {
    return LEGAL_RISK_ALERT_MESSAGE;
  }
  return null;
}
