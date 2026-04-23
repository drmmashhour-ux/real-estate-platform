import { DEFAULT_PRIORITIZATION_WEIGHTS } from "./market-domination.config";
import type {
  CompetitorPressureView,
  ExpansionReadiness,
  HubType,
  PrioritizedMarket,
  Territory,
  TerritoryDomination,
} from "./market-domination.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function prioritizeMarkets(
  territories: Territory[],
  readiness: Record<string, ExpansionReadiness>,
  domination: Record<string, TerritoryDomination>,
  competitorViews: Record<string, CompetitorPressureView>
): PrioritizedMarket[] {
  const w = DEFAULT_PRIORITIZATION_WEIGHTS;
  const out: PrioritizedMarket[] = [];

  for (const t of territories) {
    const r = readiness[t.id];
    const d = domination[t.id];
    const c = competitorViews[t.id];
    if (!r || !d || !c) continue;

    const revenueUpside = clamp01(t.metrics.revenueCents / 600_000_000 + t.metrics.bookingVolume / 600);
    const speedToWin = clamp01(r.score / 100 + (d.trend === "up" ? 0.15 : 0));
    const demandIntensity = clamp01(
      (t.metrics.buyerDemand + t.metrics.renterDemand + t.metrics.investorActivity) / 400
    );
    const strategicFit = clamp01(r.score / 100);
    const operationalFeasibility = clamp01(t.metrics.activeBrokers / 90 + t.metrics.activeUsers / 1000);
    const competitorWeakness = clamp01(1 - c.pressureScore / 12);

    const priorityScore =
      w.revenueUpside * revenueUpside +
      w.speedToWin * speedToWin +
      w.demandIntensity * demandIntensity +
      w.strategicFit * strategicFit +
      w.operationalFeasibility * operationalFeasibility +
      w.competitorWeakness * competitorWeakness;

    const hubs: HubType[] = [];
    if (t.metrics.bnhubSupply < t.metrics.bookingVolume / 4) hubs.push("BNHUB");
    if (t.metrics.activeBrokers < 40) hubs.push("BROKER");
    if (t.metrics.investorActivity > 55) hubs.push("INVESTOR");
    if (t.metrics.buyerDemand > t.metrics.listingsCount / 3) hubs.push("BUYER");
    if (t.metrics.residenceServicesSupply < 40) hubs.push("RESIDENCE");
    if (hubs.length === 0) hubs.push("SELLER", "BUYER");

    const actions: string[] = [];
    if (r.band === "PRIORITY" || r.band === "READY") {
      actions.push(`Scale growth plays in ${t.name} with weekly exec review`);
    }
    if (c.pressureScore > 7) {
      actions.push("Pair demand capture with differentiated broker + BNHub narrative");
    }
    if (t.metrics.supplyDemandRatio < 0.85) {
      actions.push("Prioritize supply recruitment before demand amplification");
    }

    let whyNow = `${t.name}: readiness ${r.band}, domination trend ${d.trend}, competitor pressure ${c.pressureScore.toFixed(1)}/10`;
    if (r.band === "NOT_READY") {
      whyNow = `Defer heavy spend — ${t.name} shows blockers: ${r.blockers[0] ?? "operational gaps"}`;
    }

    out.push({
      rank: 0,
      territoryId: t.id,
      territoryName: t.name,
      whyNow,
      targetHubs: [...new Set(hubs)].slice(0, 4),
      recommendedActions: actions.slice(0, 4),
      priorityScore,
    });
  }

  out.sort((a, b) => b.priorityScore - a.priorityScore);
  out.forEach((x, i) => {
    x.rank = i + 1;
  });

  return out;
}
