import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";
import { insightsFromBottlenecks } from "./bottleneck-strategy.service";
import { insightsFromGrowth } from "./growth-opportunity.service";
import { balanceInsights } from "./risk-opportunity-balancer.service";
import type { StrategyInsight } from "./strategy-board.types";

export function buildStrategyInsights(metrics: CompanyMetricsSnapshot): StrategyInsight[] {
  const raw: StrategyInsight[] = [
    ...insightsFromBottlenecks(metrics),
    ...insightsFromGrowth(metrics),
  ];

  if (metrics.compliance.openCases > 6) {
    raw.push({
      type: "financial_risk",
      title: "Charge conformité / qualité",
      summary: "Volume élevé de dossiers conformité ouverts — risque opérationnel sur les délais.",
      impactLevel: "high",
      urgency: "high",
      reasons: [`${metrics.compliance.openCases} cas ouverts dans le périmètre.`],
      suggestedActions: ["Allouer du temps de revue ou prioriser par date de closing attendue."],
      affectedArea: "compliance",
      ownerReviewRequired: true,
    });
  }

  if (metrics.finance.overdueInvoices > 2) {
    raw.push({
      type: "financial_risk",
      title: "Facturation — retards",
      summary: "Les factures en retard augmentent le risque de trésorerie bureau (données internes).",
      impactLevel: metrics.finance.overdueInvoices > 6 ? "high" : "medium",
      urgency: "medium",
      reasons: [`${metrics.finance.overdueInvoices} facture(s) au statut overdue.`],
      suggestedActions: ["Relances conformes aux politiques du bureau."],
      affectedArea: "billing",
      ownerReviewRequired: true,
    });
  }

  return balanceInsights(raw);
}
