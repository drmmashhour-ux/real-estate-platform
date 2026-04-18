import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { StrategyInsight } from "./strategy-board.types";

export function insightsFromBottlenecks(m: CompanyMetricsSnapshot): StrategyInsight[] {
  const out: StrategyInsight[] = [];

  const financing = m.rankings.bottlenecksByStage.find((b) => b.stage === "financing");
  if (financing && financing.dealCount >= 3) {
    out.push({
      type: "bottleneck",
      title: "Charge en étape financement",
      summary: `${financing.dealCount} dossier(s) actif(s) en statut financement — vérifier conditions et suivis banque/notaire selon vos processus.`,
      impactLevel: financing.dealCount >= 8 ? "high" : "medium",
      urgency: "medium",
      reasons: ["Répartition interne des statuts de dossiers actifs."],
      suggestedActions: ["Point hebdomadaire sur dossiers financement avec coordinateurs."],
      affectedArea: "execution_pipeline",
      ownerReviewRequired: true,
    });
  }

  if (m.blockers.blockedDealRequests >= 2) {
    out.push({
      type: "bottleneck",
      title: "Blocages sur demandes (dossiers actifs)",
      summary: "Des demandes sont en statut BLOCKED — risque de retard sur closing.",
      impactLevel: "high",
      urgency: "high",
      reasons: [`${m.blockers.blockedDealRequests} demande(s) bloquée(s) (périmètre actuel).`],
      suggestedActions: ["Escalade courtier + retrait des dépendances documentaires."],
      affectedArea: "document_requests",
      ownerReviewRequired: true,
    });
  }

  return out;
}
