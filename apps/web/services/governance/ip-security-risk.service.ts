/**
 * Lightweight governance risk classification — advisory only; not compliance or certification.
 */
import type { IpSecurityGovernanceSnapshot } from "./ip-security-governance.types";

export type GovernanceRiskResult = {
  riskLevel: "low" | "medium" | "high";
  topRisks: string[];
  reasoning: string[];
};

export function computeGovernanceRisk(
  data: Pick<IpSecurityGovernanceSnapshot, "legal" | "security" | "production">,
): GovernanceRiskResult {
  const reasoning: string[] = [];
  const topRisks: string[] = [];

  if (!data.legal.termsOfServicePresent || !data.legal.privacyPolicyPresent) {
    topRisks.push("Core legal drafts (terms/privacy) missing from docs/legal/");
    reasoning.push("Missing baseline legal documentation increases governance uncertainty (observational).");
  }
  if (!data.legal.privacyPolicyPresent) {
    topRisks.push("Privacy policy draft missing — especially sensitive in Québec/Law 25 context");
    reasoning.push("Privacy policy presence is used as a documentation readiness signal (not legal advice).");
  }
  if (!data.security.stripeSecurityReviewed) {
    topRisks.push("Stripe-related security checklist items may be incomplete");
    reasoning.push("Payments path relies on Stripe configuration per PROD security checklist.");
  }
  if (!data.security.authReviewDone || !data.security.apiSecurityReviewed) {
    topRisks.push("Auth and/or API protection checklist sections may be incomplete");
    reasoning.push("Identity, session, and API abuse sections in PROD checklist drive this signal.");
  }
  if (data.production.productionReadyScore != null && data.production.productionReadyScore < 0.4) {
    topRisks.push("Launch readiness checkbox ratio appears low in docs/launch/LAUNCH-READINESS-REPORT.md");
    reasoning.push("Derived from markdown checkbox completion only.");
  }
  if (data.production.criticalIncidentsCount > 0) {
    topRisks.push("Critical incidents recorded in snapshot (when wired)");
    reasoning.push("Placeholder — connect to incident tooling when available.");
  }

  let riskLevel: GovernanceRiskResult["riskLevel"] = "low";
  const highSignals =
    (!data.legal.privacyPolicyPresent && !data.legal.termsOfServicePresent) ||
    (!data.security.stripeSecurityReviewed && !data.security.authReviewDone);
  if (highSignals || topRisks.length >= 4) riskLevel = "high";
  else if (topRisks.length >= 1) riskLevel = "medium";

  return { riskLevel, topRisks: topRisks.slice(0, 12), reasoning };
}
