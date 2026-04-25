import { getCityConfig, CityConfig } from "./geo-target.config";
import { getMarketMetricsForCity, CityMarketMetrics } from "./market-metrics.service";

export interface CityStrategy {
  cityName: string;
  focus: "DOMINATION" | "EXPANSION" | "SEEDING" | "WATCH";
  actions: string[];
  brokerAcquisitionPlan: string;
  priorityLeadCapture: boolean;
}

export async function getCityStrategy(city: string): Promise<CityStrategy> {
  const config = getCityConfig(city);
  const metrics = await getMarketMetricsForCity(city);

  if (!config) {
    return {
      cityName: city,
      focus: "WATCH",
      actions: ["Monitor regional inquiries", "Identify key local agencies"],
      brokerAcquisitionPlan: "Gather baseline market data.",
      priorityLeadCapture: false
    };
  }

  if (config.isPrimaryMarket) {
    return {
      cityName: city,
      focus: "DOMINATION",
      actions: [
        "Optimize pricing for maximum LTV",
        "Deepen OACIQ alignment",
        "Launch local broker referral network"
      ],
      brokerAcquisitionPlan: "Aggressive Instagram/LinkedIn outreach targeting top-tier agencies.",
      priorityLeadCapture: true
    };
  }

  if (metrics.readinessScore > 70) {
    return {
      cityName: city,
      focus: "EXPANSION",
      actions: [
        "Enable localized landing pages",
        "A/B test pricing sensitivity",
        "Hire local market operator"
      ],
      brokerAcquisitionPlan: "Direct sales and partnership with mid-sized independent firms.",
      priorityLeadCapture: true
    };
  }

  return {
    cityName: city,
    focus: "SEEDING",
    actions: [
      "Gather initial broker feedback",
      "Run small-scale lead gen ads",
      "Track regional pricing benchmarks"
    ],
    brokerAcquisitionPlan: "Passive sourcing and early-adopter special offers ($49 leads).",
    priorityLeadCapture: false
  };
}
