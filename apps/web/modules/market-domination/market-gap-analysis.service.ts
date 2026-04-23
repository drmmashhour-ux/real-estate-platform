import type { MarketGap, Territory } from "./market-domination.types";

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `gap-${Date.now()}`;
}

export function analyzeMarketGaps(territories: Territory[]): MarketGap[] {
  const gaps: MarketGap[] = [];

  for (const t of territories) {
    const m = t.metrics;
    const demand = m.buyerDemand + m.renterDemand + m.investorActivity * 0.5;
    const supply = m.listingsCount + m.bnhubSupply + m.residenceServicesSupply;

    if (demand > 120 && supply < demand * 0.65) {
      gaps.push({
        id: uid(),
        gapType: "HIGH_DEMAND_LOW_SUPPLY",
        territoryId: t.id,
        severity: demand > 180 ? "critical" : "important",
        whyItMatters:
          "Demand signals exceed normalized supply proxies — risk of leakage to competitors or off-platform deals.",
        recommendedNextMove:
          "Recruit listings/stays and prioritize BNHub inventory in this territory before scaling paid acquisition.",
      });
    }

    if (m.leadVolume > 80 && m.conversionRate < 0.12) {
      gaps.push({
        id: uid(),
        gapType: "TRAFFIC_WEAK_CONVERSION",
        territoryId: t.id,
        severity: "watch",
        whyItMatters: "Lead flow exists but conversion is soft — routing, speed-to-lead, or offer-market fit.",
        recommendedNextMove: "Tighten broker routing + landing alignment; coach skeptical objections.",
      });
    }

    if (m.activeBrokers < 25 && m.leadVolume > 60) {
      gaps.push({
        id: uid(),
        gapType: "BROKER_UNDERREPRESENTED",
        territoryId: t.id,
        severity: "important",
        whyItMatters: "Inbound intent exceeds broker bench depth — SLA and coverage risk.",
        recommendedNextMove: "Broker acquisition sprint + partner onboarding playbook.",
      });
    }

    if (m.bnhubSupply < 40 && m.bookingVolume > 150) {
      gaps.push({
        id: uid(),
        gapType: "BNHUB_LOW_INVENTORY",
        territoryId: t.id,
        severity: "important",
        whyItMatters: "Booking velocity without inventory depth caps revenue and NPS.",
        recommendedNextMove: "Supply acquisition push + host incentives for this micro-market.",
      });
    }

    if (m.investorActivity > 70 && m.listingsCount < 120) {
      gaps.push({
        id: uid(),
        gapType: "INVESTOR_INTEREST_WEAK_INVENTORY",
        territoryId: t.id,
        severity: "watch",
        whyItMatters: "Investor demand without deal inventory reduces trust in deal flow.",
        recommendedNextMove: "Investor-first listings pipeline + diligence-ready packages.",
      });
    }

    if (m.renterDemand > 70 && m.residenceServicesSupply < 35) {
      gaps.push({
        id: uid(),
        gapType: "RESIDENCE_DEMAND_LOW_SUPPLY",
        territoryId: t.id,
        severity: "watch",
        whyItMatters: "Residence demand without services supply strains conversion on care-led journeys.",
        recommendedNextMove: "Recruit residence operators and bundle BNHub adjacency offers.",
      });
    }
  }

  return gaps.sort((a, b) => {
    const rank = { critical: 3, important: 2, watch: 1 };
    return rank[b.severity] - rank[a.severity];
  });
}
