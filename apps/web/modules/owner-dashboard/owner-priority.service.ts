import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { OwnerPriority } from "./owner-dashboard.types";

export function deriveOwnerPriorities(m: CompanyMetricsSnapshot): OwnerPriority[] {
  const items: OwnerPriority[] = [];
  let rank = 1;

  if (m.blockers.blockedDealRequests > 0) {
    items.push({
      id: "p_block",
      rank: rank++,
      title: "Lever les blocages documentaires",
      rationale: `${m.blockers.blockedDealRequests} blocage(s) actif(s) identifié(s) sur la file d’exécution.`,
      suggestedAction: "Réviser les demandes BLOCKED avec les courtiers responsables.",
    });
  }

  if (m.blockers.overdueInvoices > 0) {
    items.push({
      id: "p_inv",
      rank: rank++,
      title: "Recouvrement factures bureau",
      rationale: `${m.blockers.overdueInvoices} facture(s) en retard selon le statut interne.`,
      suggestedAction: "Coordonner avec la finance du bureau pour mise à jour des paiements.",
    });
  }

  if (m.compliance.openCases > 3) {
    items.push({
      id: "p_comp",
      rank: rank++,
      title: "Réduire la file conformité",
      rationale: `${m.compliance.openCases} cas ouverts nécessitent revue.`,
      suggestedAction: "Prioriser les cas liés aux dossiers en closing imminent.",
    });
  }

  if (m.listings.marketingEngagementAvg != null && m.listings.marketingEngagementAvg < 30) {
    items.push({
      id: "p_list_eng",
      rank: rank++,
      title: "Qualité médias / fiches inscriptions",
      rationale: "Index d’engagement interne bas sur l’échantillon de fiches résidentielles.",
      suggestedAction: "Encourager complétion factuelle des annonces avant dépenses média.",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "p_default",
      rank: 1,
      title: "Maintenir le rythme de closing",
      rationale: "Aucun signal critique dominant dans la fenêtre courante.",
      suggestedAction: "Surveiller les tendances hebdomadaires et la charge conformité.",
    });
  }

  return items;
}
