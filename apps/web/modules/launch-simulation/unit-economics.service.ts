import type { LaunchSimulationAssumptions } from "./launch-simulation.types";
import type { ThreeMonthProjection } from "./launch-simulation.types";
import type { UnitEconomicsSummary } from "./launch-simulation.types";

export function buildUnitEconomics(
  a: LaunchSimulationAssumptions,
  p: ThreeMonthProjection
): UnitEconomicsSummary {
  const hosts = a.hostsOnboarded.m1 + a.hostsOnboarded.m2 + a.hostsOnboarded.m3;
  const brokers = a.activeBrokers.m1 + a.activeBrokers.m2 + a.activeBrokers.m3;
  const gmv =
    p.months.reduce((s, m) => s + m.modeledLodgingGmvCad, 0);

  const rev = p.cumulativeRevenueCad;

  const cacEnv = process.env.INVESTOR_MARKETING_SPEND_30D;
  const cacCad =
    cacEnv != null && cacEnv.trim() !== "" && Number.isFinite(Number(cacEnv))
      ? Number(cacEnv) / Math.max(1, hosts + brokers)
      : null;

  return {
    kind: "unit_economics_estimate",
    projectedPlatformRevenue3mCad: rev,
    modeledLodgingGmv3mCad: gmv,
    avgRevenuePerHost3mCad: hosts > 0 ? rev / hosts : null,
    avgRevenuePerBroker3mCad: brokers > 0 ? rev / brokers : null,
    cacCad,
    cacNote:
      cacCad != null
        ? "Rough placeholder: INVESTOR_MARKETING_SPEND_30D / (hosts+brokers sum) — not validated CAC."
        : "CAC not computed — set INVESTOR_MARKETING_SPEND_30D for a rough placeholder or provide finance model.",
    paybackNote: "Payback not modeled — requires CAC definition and cohort gross margin.",
    notes: [
      "ARP* metrics divide projected platform revenue by summed monthly cohort counts — not GAAP revenue per user.",
    ],
  };
}
