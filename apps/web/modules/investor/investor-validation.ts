import type { InvestorIcPackPayload, InvestorMemoPayload } from "@/modules/investor/investor.types";

/** Guardrails before persistence */
export function validateMemoPayload(payload: InvestorMemoPayload): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload.decisionTrace?.rationale?.trim()) errors.push("Missing recommendation rationale trace.");
  if (
    !payload.disclaimers?.verifiedVsEstimated?.trim() ||
    !payload.disclaimers?.internalToolDisclaimer?.trim() ||
    !payload.disclaimers?.adviceDisclaimer?.trim()
  ) {
    errors.push("Incomplete disclaimer section.");
  }
  return { ok: errors.length === 0, errors };
}

export function validateIcPackPayload(payload: InvestorIcPackPayload): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const ra = payload.riskAssessment;
  const hasRisk =
    (ra?.criticalRisks?.length ?? 0) +
      (ra?.highRisks?.length ?? 0) +
      (ra?.mediumRisks?.length ?? 0) +
      (ra?.mitigants?.length ?? 0) >
    0;
  if (!hasRisk) errors.push("IC pack requires risk assessment content.");
  if (!payload.decisionTrace?.rationale?.trim()) errors.push("Missing decision rationale.");
  if (
    !payload.disclaimers?.verifiedVsEstimated?.trim() ||
    !payload.disclaimers?.internalToolDisclaimer?.trim() ||
    !payload.disclaimers?.adviceDisclaimer?.trim()
  ) {
    errors.push("Incomplete disclaimers.");
  }
  return { ok: errors.length === 0, errors };
}
