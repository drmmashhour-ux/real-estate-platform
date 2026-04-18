/**
 * Observational governance alerts — no enforcement, no side effects.
 */
import type { IpSecurityGovernanceSnapshot } from "./ip-security-governance.types";
import { computeGovernanceRisk } from "./ip-security-risk.service";

export type GovernanceAlert = {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  category: "legal" | "security" | "production" | "ip";
};

export type GovernanceAlertsResult = {
  alerts: GovernanceAlert[];
  highestSeverity: "info" | "warning" | "critical";
};

let alertSeq = 0;
function nextId(): string {
  alertSeq++;
  return `gov_alert_${alertSeq}`;
}

export function resetGovernanceAlertSeqForTests(): void {
  alertSeq = 0;
}

export function buildGovernanceAlerts(snapshot: IpSecurityGovernanceSnapshot): GovernanceAlertsResult {
  const alerts: GovernanceAlert[] = [];
  const risk = computeGovernanceRisk(snapshot);

  if (!snapshot.legal.termsOfServicePresent) {
    alerts.push({
      id: nextId(),
      message: "Terms of service draft not found under docs/legal/",
      severity: "warning",
      category: "legal",
    });
  }
  if (!snapshot.legal.privacyPolicyPresent) {
    alerts.push({
      id: nextId(),
      message: "Privacy policy draft not found — review Québec/Law 25 checklist with counsel",
      severity: "critical",
      category: "legal",
    });
  }
  if (!snapshot.legal.law25ChecklistPresent) {
    alerts.push({
      id: nextId(),
      message: "Law 25 operational checklist file missing",
      severity: "warning",
      category: "legal",
    });
  }
  if (!snapshot.security.stripeSecurityReviewed) {
    alerts.push({
      id: nextId(),
      message: "Stripe checklist lines in PROD security doc may be incomplete",
      severity: "critical",
      category: "security",
    });
  }
  if (!snapshot.security.authReviewDone) {
    alerts.push({
      id: nextId(),
      message: "Identity / session checklist sections may need completion",
      severity: "warning",
      category: "security",
    });
  }
  if (snapshot.production.productionReadyScore != null && snapshot.production.productionReadyScore < 0.45) {
    alerts.push({
      id: nextId(),
      message: "Production readiness score (doc checkboxes) is below threshold",
      severity: "warning",
      category: "production",
    });
  }
  if (snapshot.production.criticalIncidentsCount > 0) {
    alerts.push({
      id: nextId(),
      message: `Critical incidents count: ${snapshot.production.criticalIncidentsCount} (verify source)`,
      severity: "critical",
      category: "production",
    });
  }
  if (!snapshot.ip.ipChecklistPresent) {
    alerts.push({
      id: nextId(),
      message: "IP protection checklist file missing from docs/legal/",
      severity: "info",
      category: "ip",
    });
  }

  if (risk.riskLevel === "high") {
    alerts.push({
      id: nextId(),
      message: "Aggregated governance risk level is high — review top risks list",
      severity: "critical",
      category: "security",
    });
  }

  let highestSeverity: GovernanceAlertsResult["highestSeverity"] = "info";
  if (alerts.some((a) => a.severity === "critical")) highestSeverity = "critical";
  else if (alerts.some((a) => a.severity === "warning")) highestSeverity = "warning";

  return { alerts, highestSeverity };
}
