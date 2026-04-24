import { TurboDraftInput, TurboDraftResult } from "../turbo-form-drafting/types";
import { ComplianceScoreResult, ComplianceStatus } from "./types";

export function calculateComplianceScore(input: TurboDraftInput, result: TurboDraftResult): ComplianceScoreResult {
  let score = 100;
  const missingItems: string[] = [];
  const riskItems: string[] = [];
  const recommendations: string[] = [];
  
  let hasCriticalMissing = false;
  let hasNoticeMissing = false;

  const { answers, representedStatus, parties } = input;

  // 1. Required fields
  if (!answers.purchasePrice && !answers.listingPrice) {
    score -= 15;
    missingItems.push("Prix non spécifié");
    hasCriticalMissing = true;
  }
  if (parties.length === 0) {
    score -= 15;
    missingItems.push("Parties non identifiées");
    hasCriticalMissing = true;
  }

  // 2. Notices
  const criticalNotices = result.notices.filter(n => n.severity === "CRITICAL");
  const unackedCritical = criticalNotices.filter(n => !n.acknowledged);
  if (unackedCritical.length > 0) {
    score -= 10 * unackedCritical.length;
    missingItems.push(`${unackedCritical.length} avis critiques non lus`);
    hasNoticeMissing = true;
  }

  // 3. AI Findings
  // @ts-ignore
  if (result.styleValidation?.clauses.some((c: any) => c.severity === "CRITICAL")) {
    score -= 20;
    riskItems.push("Anomalies de rédaction critiques détectées par l'IA");
    hasCriticalMissing = true;
  }

  // 4. Representation
  if (representedStatus === "NOT_REPRESENTED") {
    score -= 10;
    riskItems.push("Acheteur non représenté");
    recommendations.push("Demander une révision par un courtier partenaire");
  }

  // 5. Legal Warranty
  if (answers.withoutWarranty) {
    score -= 5;
    riskItems.push("Vente sans garantie légale");
    recommendations.push("Augmenter la portée de l'inspection préachat");
  }

  // 6. Inclusions/Exclusions
  if (!answers.inclusions) {
    score -= 5;
    riskItems.push("Inclusions non précisées");
    recommendations.push("Lister explicitement les biens meubles inclus (ex: électros)");
  }

  // 7. Financing
  if (answers.financingRequired && !answers.financingDelay) {
    score -= 10;
    missingItems.push("Délai de financement manquant");
    hasCriticalMissing = true;
  }

  // 8. Law 25 / Privacy
  if (!answers.privacyConsent) {
    score -= 10;
    missingItems.push("Consentement Loi 25 manquant");
    hasNoticeMissing = true;
  }

  // Score Capping Rules
  if (hasCriticalMissing) {
    score = Math.min(score, 69);
  } else if (hasNoticeMissing) {
    score = Math.min(score, 79);
  }

  score = Math.max(0, Math.min(100, score));

  let status: ComplianceStatus = "LOW";
  if (score >= 90 && !hasCriticalMissing && !hasNoticeMissing) status = "READY";
  else if (score >= 80) status = "HIGH";
  else if (score >= 70) status = "MEDIUM";

  return {
    score,
    status,
    missingItems,
    riskItems,
    recommendations
  };
}
