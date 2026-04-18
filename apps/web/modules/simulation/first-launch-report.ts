import { buildFirst100DollarsStrategy } from "@/modules/launch/first-100-dollars.service";
import { buildMicroLaunchCampaignSetup } from "@/modules/ads/campaign-setup";
import { simulateFirstTenUsers } from "./first-users";
import { buildLaunchOptimizationRecommendations } from "./launch-optimization";

/**
 * Single entry: $100 strategy + Ads structure + 10-user simulation + recommendations.
 * All deterministic — replace with live dashboard data when traffic exists.
 */
export type FirstLaunchSimulationReport = ReturnType<typeof runFirstLaunchSimulationReport>;

export function runFirstLaunchSimulationReport() {
  const budget = buildFirst100DollarsStrategy();
  const campaignSetup = buildMicroLaunchCampaignSetup();
  const { users, aggregate } = simulateFirstTenUsers();
  const recommendations = buildLaunchOptimizationRecommendations(aggregate, users);

  return {
    version: "LECIPM First Launch Simulation v1" as const,
    budget,
    campaignSetup,
    users,
    aggregate,
    recommendations,
    disclaimer:
      "Simulation only — not production metrics. Validate with growth_events, Stripe, and real user tests.",
    qaNote:
      "Live BNHub booking + Stripe is not exercised by this page — treat conversion claims as unvalidated until E2E passes.",
  };
}
