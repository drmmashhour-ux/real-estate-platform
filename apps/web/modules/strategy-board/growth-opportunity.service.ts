import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import type { StrategyInsight } from "./strategy-board.types";

export function insightsFromGrowth(m: CompanyMetricsSnapshot): StrategyInsight[] {
  const out: StrategyInsight[] = [];
  const top = m.rankings.topNeighborhoods[0];
  if (top && top.activeListings >= 3) {
    out.push({
      type: "listing_performance",
      title: "Concentration d’inscriptions par secteur",
      summary: `Le secteur « ${top.city} » concentre plusieurs fiches actives — utile pour modèles de communication internes (faits publiés uniquement).`,
      impactLevel: "medium",
      urgency: "low",
      reasons: [`${top.activeListings} fiche(s) active(s) recensée(s) pour ce secteur (périmètre).`],
      suggestedActions: ["Partager les pratiques médias/descriptions au sein de l’équipe sans promesse de rendement."],
      affectedArea: "listings",
      ownerReviewRequired: true,
    });
  }

  const broker = m.rankings.topBrokers[0];
  if (broker && broker.closedDeals >= 2) {
    out.push({
      type: "broker_productivity",
      title: "Productivité relative (closings)",
      summary: `Le courtier ${broker.brokerName ?? broker.brokerId} a ${broker.closedDeals} closing(s) dans la fenêtre — matière à mentorat interne.`,
      impactLevel: "low",
      urgency: "low",
      reasons: ["Classement interne sur fermetures de dossiers résidentiels."],
      suggestedActions: ["Documenter les pratiques de suivi sans divulguer de données personnelles."],
      affectedArea: "brokers",
      ownerReviewRequired: true,
    });
  }

  return out;
}
