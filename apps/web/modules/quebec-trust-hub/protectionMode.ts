import { ProtectionModeStatus } from "./types";

export function getProtectionModeStatus(context: any): ProtectionModeStatus {
  const reasons: string[] = [];
  const { answers, representedStatus, resultJson } = context;

  if (representedStatus === "NOT_REPRESENTED") {
    reasons.push("Acheteur non représenté");
  }

  if (answers?.withoutWarranty) {
    reasons.push("Vente sans garantie légale");
  }

  if (!answers?.privacyConsent) {
    reasons.push("Consentement Loi 25 manquant");
  }

  const risks = resultJson?.risks || [];
  const criticalRisks = risks.filter((r: any) => r.severity === "CRITICAL");
  if (criticalRisks.length > 0) {
    reasons.push(`${criticalRisks.length} risques critiques détectés`);
  }

  if (!answers?.financingDelay && answers?.financingRequired) {
    reasons.push("Condition de financement incomplète");
  }

  return {
    enabled: reasons.length > 0,
    reasons
  };
}
