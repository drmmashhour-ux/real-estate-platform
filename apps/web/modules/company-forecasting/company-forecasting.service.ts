import { aggregateCompanyMetrics } from "../company-metrics/company-metrics-aggregation.service";
import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import { forecastingDisclaimer } from "./estimate-explainer.service";
import { projectFromRate } from "./scenario-model.service";
import type { CompanyForecastPayload, ForecastMetricEstimate } from "./company-forecasting.types";

function daysInWindow(window: CompanyMetricsWindow, custom?: { from: string; to: string }): number {
  if (window === "custom" && custom?.from && custom?.to) {
    const a = new Date(custom.from).getTime();
    const b = new Date(custom.to).getTime();
    return Math.max(1, Math.ceil((b - a) / 86400000));
  }
  if (window === "today") return 1;
  if (window === "7d") return 7;
  if (window === "30d") return 30;
  if (window === "quarter") return 90;
  if (window === "year") return 365;
  return 30;
}

export async function buildCompanyForecast(
  scope: ExecutiveScope,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
  horizonDays = 30,
): Promise<CompanyForecastPayload> {
  const m = await aggregateCompanyMetrics(scope, window, custom);
  const windowDays = daysInWindow(window, custom);

  const assumptions = [
    `Fenêtre historique: ${windowDays} jour(s) (${m.range.label}).`,
    `Horizon de projection: ${horizonDays} jour(s).`,
    "Méthode: extrapolation linéaire du rythme observé × facteurs de scénario (0,85 / 1 / 1,15).",
  ];

  const confidenceNotes = [
    "Ne tient pas compte des saisonnalités externes ni des changements réglementaires.",
    "Valide uniquement tant que le volume d’historique est représentatif.",
  ];

  const closings = m.deals.closed;
  const commission = m.finance.totalCommissionVolumeCents;
  const payouts = m.finance.brokerPayoutTotalCents;
  const complianceLoad = m.compliance.casesOpened;
  const avgCommissionPerClose = closings > 0 ? commission / closings : 0;
  const avgPayoutPerClose = closings > 0 ? payouts / closings : 0;

  const metrics: ForecastMetricEstimate[] = [
    {
      metric: "projected_closings",
      baselineEstimate: projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "baseline" }),
      optimisticEstimate: projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "optimistic" }),
      conservativeEstimate: projectFromRate({
        observedCount: closings,
        windowDays,
        horizonDays,
        scenario: "conservative",
      }),
      unit: "count",
      assumptions,
      confidenceNotes,
    },
    {
      metric: "projected_commission_volume_cents",
      baselineEstimate: Math.round(
        projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "baseline" }) * avgCommissionPerClose,
      ),
      optimisticEstimate: Math.round(
        projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "optimistic" }) * avgCommissionPerClose,
      ),
      conservativeEstimate: Math.round(
        projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "conservative" }) * avgCommissionPerClose,
      ),
      unit: "cad_cents",
      assumptions: [
        ...assumptions,
        closings > 0
          ? "Commission moyenne par closing observée sur la fenêtre (approximation interne)."
          : "Aucun closing dans la fenêtre — volume projeté à 0; ajuster la fenêtre pour une estimation.",
      ],
      confidenceNotes,
    },
    {
      metric: "projected_payout_obligations_cents",
      baselineEstimate: Math.round(
        projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "baseline" }) * avgPayoutPerClose,
      ),
      optimisticEstimate: Math.round(
        projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "optimistic" }) * avgPayoutPerClose,
      ),
      conservativeEstimate: Math.round(
        projectFromRate({ observedCount: closings, windowDays, horizonDays, scenario: "conservative" }) * avgPayoutPerClose,
      ),
      unit: "cad_cents",
      assumptions: [...assumptions, "Basé sur les paiements bureau enregistrés dans la fenêtre."],
      confidenceNotes,
    },
    {
      metric: "projected_compliance_review_load",
      baselineEstimate: projectFromRate({
        observedCount: complianceLoad,
        windowDays,
        horizonDays,
        scenario: "baseline",
      }),
      optimisticEstimate: projectFromRate({
        observedCount: complianceLoad,
        windowDays,
        horizonDays,
        scenario: "optimistic",
      }),
      conservativeEstimate: projectFromRate({
        observedCount: complianceLoad,
        windowDays,
        horizonDays,
        scenario: "conservative",
      }),
      unit: "count",
      assumptions,
      confidenceNotes,
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    isEstimate: true,
    metrics,
    disclaimer: forecastingDisclaimer(),
  };
}
