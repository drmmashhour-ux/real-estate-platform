import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { OwnerDashboardPayload } from "../owner-dashboard/owner-dashboard.types";

/**
 * Rank executive priorities from real metrics + owner dashboard derivations (no fabricated causes).
 */
export function rankFounderPriorities(
  current: CompanyMetricsSnapshot,
  dashboard: OwnerDashboardPayload,
): { title: string; rationale: string; evidenceRefs: string[] }[] {
  const out: { title: string; rationale: string; evidenceRefs: string[] }[] = [];

  if (current.blockers.blockedDealRequests > 0) {
    out.push({
      title: "Demandes de dossier bloquées",
      rationale: `Nombre actuel de demandes en statut bloqué dans la portée résidentielle.`,
      evidenceRefs: [`blockers.blockedDealRequests=${current.blockers.blockedDealRequests}`],
    });
  }
  if (current.finance.overdueInvoices > 0) {
    out.push({
      title: "Factures bureau en retard",
      rationale: `Comptage des factures avec statut en retard.`,
      evidenceRefs: [`finance.overdueInvoices=${current.finance.overdueInvoices}`],
    });
  }
  if (current.compliance.openCases > 0) {
    out.push({
      title: "Dossiers de conformité ouverts",
      rationale: `Dossiers de conformité non clos dans la portée.`,
      evidenceRefs: [`compliance.openCases=${current.compliance.openCases}`],
    });
  }
  if (current.blockers.dealsStuckFinancing > 0) {
    out.push({
      title: "Dossiers signalés en financement bloqué",
      rationale: `Comptage interne des dossiers actifs avec financement bloqué.`,
      evidenceRefs: [`blockers.dealsStuckFinancing=${current.blockers.dealsStuckFinancing}`],
    });
  }

  for (const p of dashboard.priorities.slice(0, 5)) {
    out.push({
      title: p.title,
      rationale: p.rationale,
      evidenceRefs: [`owner_dashboard.priority:${p.id}`],
    });
  }

  return out.slice(0, 12);
}
