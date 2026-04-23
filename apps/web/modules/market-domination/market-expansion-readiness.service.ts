import { DEFAULT_READINESS_WEIGHTS } from "./market-domination.config";
import type { ExpansionReadiness, ReadinessBand, Territory } from "./market-domination.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function bandFromScore(score: number): ReadinessBand {
  if (score < 35) return "NOT_READY";
  if (score < 55) return "EMERGING";
  if (score < 78) return "READY";
  return "PRIORITY";
}

export function scoreExpansionReadiness(t: Territory): ExpansionReadiness {
  const m = t.metrics;
  const w = DEFAULT_READINESS_WEIGHTS;

  const supply = clamp01(m.listingsCount / 400 + m.bnhubSupply / 150 + m.residenceServicesSupply / 100);
  const demandSignals = clamp01(
    (m.buyerDemand + m.renterDemand + m.investorActivity) / 350
  );
  const operationalCoverage = clamp01(m.activeBrokers / 70 + m.activeUsers / 900);
  const revenueSignals = clamp01(m.revenueCents / 400_000_000 + m.bookingVolume / 500);
  const conversionPotential = m.conversionRate;
  const localTraction = clamp01(0.6 * (1 + m.growthRate) + 0.4 * clamp01(m.leadVolume / 220));

  const score =
    (w.supply * supply +
      w.demandSignals * demandSignals +
      w.operationalCoverage * operationalCoverage +
      w.revenueSignals * revenueSignals +
      w.conversionPotential * conversionPotential +
      w.localTraction * localTraction) *
    100;

  const strengths: string[] = [];
  const blockers: string[] = [];

  if (demandSignals > 0.55) strengths.push("Strong multi-channel demand signals");
  else blockers.push("Demand still fragmented or seasonal");

  if (supply > 0.45) strengths.push("Meaningful supply stack across verticals");
  else blockers.push("Thin inventory vs demand proxy");

  if (operationalCoverage > 0.45) strengths.push("Broker bench and active users support execution");
  else blockers.push("Operational coverage lagging demand");

  if (m.supplyDemandRatio > 1.2) blockers.push("Supply-heavy vs demand — avoid over-recruiting before demand lift");

  let strategy = "Pilot with tight routing rules and weekly reviews.";
  if (bandFromScore(score) === "PRIORITY") {
    strategy =
      "Full court press: BNHub + broker acquisition + investor content triangle with dedicated ops cadence.";
  } else if (bandFromScore(score) === "NOT_READY") {
    strategy = "Seed supply and validate micro-market demand before paid scale.";
  }

  return {
    territoryId: t.id,
    score: Math.round(Math.max(0, Math.min(100, score))),
    band: bandFromScore(score),
    strengths,
    blockers,
    recommendedEntryStrategy: strategy,
  };
}
