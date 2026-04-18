import type { BrokerGrowthMetrics } from "../broker-growth/broker-growth.types";
import type { GrowthCoachSummary } from "./growth-coach.types";

export function buildGrowthRecommendations(input: {
  metrics: BrokerGrowthMetrics;
  goals: {
    monthlyLeadTarget: number | null;
    monthlyClosingTarget: number | null;
    responseTimeHoursTarget: number | null;
    listingConversionRateTarget: number | null;
    followUpDisciplineTarget: number | null;
  } | null;
}): GrowthCoachSummary {
  const recs: string[] = [];
  const bottlenecks: string[] = [];

  if (input.metrics.velocity.avgTimeToFirstResponseHours != null && input.goals?.responseTimeHoursTarget != null) {
    if (input.metrics.velocity.avgTimeToFirstResponseHours > input.goals.responseTimeHoursTarget) {
      bottlenecks.push("Temps de première réponse au-dessus de l’objectif.");
      recs.push("Prioriser une réponse CRM le même jour pour les nouvelles demandes.");
    }
  }

  if (input.metrics.pipeline.leadConversionRate != null && input.goals?.listingConversionRateTarget != null) {
    if (input.metrics.pipeline.leadConversionRate < input.goals.listingConversionRateTarget) {
      bottlenecks.push("Conversion pipeline sous l’objectif interne.");
      recs.push("Revoir le suivi des leads tièdes/chauds avec tâches datées.");
    }
  }

  if (input.metrics.listings.listingInquiryRate != null && input.metrics.listings.listingInquiryRate < 0.02) {
    recs.push("Renforcer médias et description factuelle sur les inscriptions actives.");
  }

  const progressSummary = "Résumé basé sur données plateforme (fenêtre courante). Aucune promesse de résultat marché.";

  return {
    progressSummary,
    growthRecommendations: recs.length ? recs : ["Maintenir la discipline de suivi hebdomadaire sur les dossiers actifs."],
    bottlenecks: bottlenecks.length ? bottlenecks : ["Aucun goulot évident détecté avec les seuils actuels."],
    bestNextActionThisWeek:
      recs[0] ?? "Réviser les annonces actives et les brouillons marketing en attente d’approbation.",
  };
}
