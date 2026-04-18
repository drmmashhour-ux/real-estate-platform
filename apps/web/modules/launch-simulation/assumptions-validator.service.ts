import { z } from "zod";
import type { LaunchSimulationAssumptions, LaunchSimulationScenario } from "./launch-simulation.types";

const MonthTripletZ = z.object({
  m1: z.number().nonnegative(),
  m2: z.number().nonnegative(),
  m3: z.number().nonnegative(),
});

const AssumptionsZ = z.object({
  scenario: z.enum(["conservative", "baseline", "optimistic"]),
  currency: z.literal("CAD"),
  marketLabel: z.string().max(200),
  horizonMonths: z.literal(3),
  configSources: z.array(z.string()),
  hostsOnboarded: MonthTripletZ,
  activeBnhubListings: MonthTripletZ,
  avgNightlyRateCad: z.number().min(0).max(5000),
  avgOccupancy: z.number().min(0).max(1),
  bnhubPlatformFeePercentOfLodgingGmv: z.number().min(0).max(100),
  hostSubscriptionShare: z.number().min(0).max(1),
  hostSubscriptionMonthlyCad: z.number().min(0),
  boostsPurchased: MonthTripletZ,
  boostPriceCad: z.number().min(0),
  activeBrokers: MonthTripletZ,
  leadsSoldPerBrokerMonth: MonthTripletZ,
  leadPriceCad: z.number().min(0),
  successFeeEventsPerBrokerMonth: MonthTripletZ,
  avgGrossCommissionCad: z.number().min(0),
  platformSuccessFeeShare: z.number().min(0).max(1),
  brokerSubscriptionMonthlyCad: z.number().min(0),
  brokerSubscriptionShare: z.number().min(0).max(1),
  docAiFeeCadMonth: MonthTripletZ,
  activationRateFromOutreach: z.number().min(0).max(1),
  hostToFirstBookingConversion: z.number().min(0).max(1),
  brokerToPaidConversion: z.number().min(0).max(1),
  notes: z.array(z.string()),
});

export function validateLaunchSimulationAssumptions(
  input: unknown
): { ok: true; value: LaunchSimulationAssumptions } | { ok: false; error: string } {
  const p = AssumptionsZ.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.message };
  return { ok: true, value: p.data as LaunchSimulationAssumptions };
}

export function safeScenario(s: string | undefined): LaunchSimulationScenario | null {
  if (s === "conservative" || s === "baseline" || s === "optimistic") return s;
  return null;
}
