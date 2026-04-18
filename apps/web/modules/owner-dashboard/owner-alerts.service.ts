import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { OwnerAlert } from "./owner-dashboard.types";

export function deriveOwnerAlerts(m: CompanyMetricsSnapshot): OwnerAlert[] {
  const alerts: OwnerAlert[] = [];

  if (m.blockers.overdueInvoices > 0) {
    alerts.push({
      id: "inv_overdue",
      level: m.blockers.overdueInvoices > 3 ? "warning" : "info",
      title: "Factures en retard",
      detail: `${m.blockers.overdueInvoices} facture(s) bureau avec statut « overdue » (données internes).`,
    });
  }

  if (m.compliance.openCases > 5) {
    alerts.push({
      id: "compliance_queue",
      level: "warning",
      title: "File conformité",
      detail: `${m.compliance.openCases} dossier(s) de conformité ouvert(s) liés aux transactions résidentielles du périmètre.`,
    });
  }

  if (m.blockers.blockedDealRequests > 0) {
    alerts.push({
      id: "blocked_requests",
      level: "critical",
      title: "Demandes bloquées sur dossiers actifs",
      detail: `${m.blockers.blockedDealRequests} demande(s) en statut BLOCKED sur des dossiers actifs.`,
    });
  }

  if (m.velocity.avgResponseTimeHours != null && m.velocity.avgResponseTimeHours > 24) {
    alerts.push({
      id: "slow_response",
      level: "warning",
      title: "Temps de réponse CRM élevé",
      detail: `Moyenne interne ~${m.velocity.avgResponseTimeHours} h sur l’échantillon (n=${m.velocity.responseSampleSize}).`,
    });
  }

  if (m.blockers.dealsStuckFinancing > 0) {
    alerts.push({
      id: "stuck_financing",
      level: "info",
      title: "Dossiers en financement sans mouvement récent",
      detail: `${m.blockers.dealsStuckFinancing} dossier(s) en statut financement sans mise à jour depuis 14 jours.`,
    });
  }

  return alerts;
}
