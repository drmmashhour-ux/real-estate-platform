import type { CompanyInsight } from "../company-insights/company-insights.types";
import type { FounderIntelligenceSnapshot } from "../founder-intelligence/founder-intelligence.types";

export function recommendFounderActions(
  snapshot: FounderIntelligenceSnapshot,
  insights: CompanyInsight[],
): { label: string; rationale: string; evidenceRefs: string[] }[] {
  const actions: { label: string; rationale: string; evidenceRefs: string[] }[] = [];

  if (snapshot.current.blockers.blockedDealRequests > 0) {
    actions.push({
      label: "Réviser les demandes BLOCKED avec les courtiers",
      rationale: "Comptage interne > 0 pour la portée résidentielle.",
      evidenceRefs: [`blockers.blockedDealRequests=${snapshot.current.blockers.blockedDealRequests}`],
    });
  }
  if (snapshot.current.finance.overdueInvoices > 0) {
    actions.push({
      label: "Synchroniser avec la finance du bureau sur factures en retard",
      rationale: "Statut interne overdue sur factures bureau.",
      evidenceRefs: [`finance.overdueInvoices=${snapshot.current.finance.overdueInvoices}`],
    });
  }

  for (const i of insights.slice(0, 5)) {
    for (const a of i.suggestedActions) {
      if (a.nature === "recommendation") {
        actions.push({
          label: a.label,
          rationale: i.title,
          evidenceRefs: i.evidence.map((e) => e.ref),
        });
      }
    }
  }

  return actions.slice(0, 12);
}
