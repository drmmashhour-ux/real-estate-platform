import { ComplianceScoreResult, TrustHubStatus } from "./types";

export function calculateComplianceScore(context: any): ComplianceScoreResult {
  let score = 100;
  const missingItems: string[] = [];
  const riskItems: string[] = [];
  const recommendations: string[] = [];

  const { answers, representedStatus, resultJson } = context;

  // 1. Required fields complete (Simplified check)
  if (!answers?.purchasePrice) {
    score -= 20;
    missingItems.push("Prix d'achat manquant");
  }
  if (!answers?.acceptanceExpiry) {
    score -= 10;
    missingItems.push("Délai d'acceptation manquant");
  }

  // 2. Required notices acknowledged
  const notices = resultJson?.notices || [];
  const acks = context.acknowledgements || [];
  const criticalNotices = notices.filter((n: any) => n.severity === "CRITICAL");
  const missingAcks = criticalNotices.filter((n: any) => !acks.find((a: any) => a.noticeKey === n.noticeKey));

  if (missingAcks.length > 0) {
    score -= missingAcks.length * 15;
    missingItems.push(`${missingAcks.length} avis critiques non acceptés`);
    // Cap score at 79 if notice missing
    if (score > 79) score = 79;
  }

  // 3. Critical AI findings / Risks
  const risks = resultJson?.risks || [];
  const criticalRisks = risks.filter((r: any) => r.severity === "CRITICAL");
  if (criticalRisks.length > 0) {
    score -= criticalRisks.length * 20;
    riskItems.push(`${criticalRisks.length} risques critiques détectés`);
    // Cap score at 69 if critical missing item/risk exists
    if (score > 69) score = 69;
  }

  // 4. Representation status
  if (representedStatus === "NOT_REPRESENTED") {
    score -= 10;
    riskItems.push("Acheteur non représenté");
    recommendations.push("Demander une révision par un courtier");
  }

  // 5. Legal warranty status
  if (answers?.withoutWarranty) {
    score -= 5;
    riskItems.push("Vente sans garantie légale");
    recommendations.push("Augmenter la rigueur de l'inspection");
  }

  // 6. Inclusions/Exclusions clarified
  if (!answers?.inclusions || answers.inclusions.length < 5) {
    score -= 5;
    riskItems.push("Inclusions peu claires");
    recommendations.push("Lister les inclusions individuellement");
  }

  // 7. Financing condition
  if (answers?.financingRequired && !answers?.financingDelay) {
    score -= 15;
    missingItems.push("Délai de financement manquant");
    if (score > 69) score = 69;
  }

  // 8. Identity verification (Placeholder)
  if (!context.identityVerified) {
    score -= 10;
    missingItems.push("Vérification d'identité incomplète");
    recommendations.push("Compléter la vérification d'identité");
  }

  // 9. Law 25 consent
  if (!answers?.privacyConsent) {
    score -= 20;
    missingItems.push("Consentement Loi 25 manquant");
    if (score > 79) score = 79;
  }

  // Ensure score is within 0-100
  score = Math.max(0, Math.min(100, score));

  let status: TrustHubStatus = "LOW";
  if (score >= 90 && criticalRisks.length === 0 && missingAcks.length === 0) {
    status = "READY";
  } else if (score >= 80) {
    status = "HIGH";
  } else if (score >= 60) {
    status = "MEDIUM";
  }

  return {
    score,
    status,
    missingItems,
    riskItems,
    recommendations
  };
}
