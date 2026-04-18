import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";
import { getBrokerAcquisitionRevenueSnapshot } from "@/modules/brokers/broker-acquisition-revenue-snapshot.service";

export type BrokerPipelineInsights = {
  /** Best territory by attributed pipeline revenue (CAD) on prospects with `territoryRegion` set. */
  bestTerritory: { region: string; revenueCad: number } | null;
  /** Highest `revenueGenerated` on a single prospect (in-memory pipeline). */
  topBrokerProspect: { id: string; name: string; revenueCad: number } | null;
  /** Dominant RevenueEvent source bucket in the last ~30 days (real DB money). */
  highestRevenueSource: { label: string; amountCad: number } | null;
};

function buildTerritoryAndTopProspect(prospects: BrokerProspect[]): {
  bestTerritory: BrokerPipelineInsights["bestTerritory"];
  topBrokerProspect: BrokerPipelineInsights["topBrokerProspect"];
} {
  const byTerr = new Map<string, number>();
  for (const p of prospects) {
    const region = p.territoryRegion?.trim();
    if (!region) continue;
    byTerr.set(region, (byTerr.get(region) ?? 0) + (p.revenueGenerated ?? 0));
  }
  let bestTerritory: BrokerPipelineInsights["bestTerritory"] = null;
  for (const [region, revenueCad] of byTerr) {
    if (!bestTerritory || revenueCad > bestTerritory.revenueCad) {
      bestTerritory = { region, revenueCad: Math.round(revenueCad * 100) / 100 };
    }
  }
  if (bestTerritory && bestTerritory.revenueCad <= 0) bestTerritory = null;

  let topBrokerProspect: BrokerPipelineInsights["topBrokerProspect"] = null;
  for (const p of prospects) {
    const revenueCad = p.revenueGenerated ?? 0;
    if (!topBrokerProspect || revenueCad > topBrokerProspect.revenueCad) {
      topBrokerProspect = { id: p.id, name: p.name, revenueCad: Math.round(revenueCad * 100) / 100 };
    }
  }
  if (topBrokerProspect && topBrokerProspect.revenueCad <= 0) topBrokerProspect = null;

  return { bestTerritory, topBrokerProspect };
}

export async function buildBrokerPipelineInsights(prospects: BrokerProspect[]): Promise<BrokerPipelineInsights> {
  const { bestTerritory, topBrokerProspect } = buildTerritoryAndTopProspect(prospects);

  let highestRevenueSource: BrokerPipelineInsights["highestRevenueSource"] = null;
  try {
    const snap = await getBrokerAcquisitionRevenueSnapshot();
    const candidates = [
      { label: "Lead unlocks & lead purchases", amountCad: snap.revenueFromLeadsCad },
      { label: "Featured / boost", amountCad: snap.revenueFromFeaturedCad },
    ].filter((c) => c.amountCad > 0);
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.amountCad - a.amountCad);
      highestRevenueSource = candidates[0]!;
    }
  } catch {
    highestRevenueSource = null;
  }

  return { bestTerritory, topBrokerProspect, highestRevenueSource };
}

export type BrokerPipelineAlerts = {
  lines: string[];
};

function utcTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lightweight operator alerts — only when we can justify from dates or DB (no invented drops).
 */
export async function buildBrokerPipelineAlerts(input: {
  prospects: BrokerProspect[];
  leadAssignmentsUnlockedToday?: number;
  /** Total assignment rows — only emit unlock alert when routing is in use. */
  assignmentsTracked?: number;
}): Promise<BrokerPipelineAlerts> {
  const lines: string[] = [];
  const today = utcTodayKey();
  const addedToday = input.prospects.filter((p) => p.createdAt.slice(0, 10) === today).length;

  if (addedToday === 0) {
    lines.push(`No broker prospects added today (${today} UTC).`);
  }

  const tracked = input.assignmentsTracked ?? 0;
  const unlockedToday = input.leadAssignmentsUnlockedToday ?? 0;
  if (tracked > 0 && unlockedToday === 0) {
    lines.push("No pipeline lead assignments unlocked today yet (Stripe-confirmed unlocks update this log).");
  }

  try {
    const snap = await getBrokerAcquisitionRevenueSnapshot();
    if (snap.revenueYesterdayCad > 0 && snap.revenueTodayCad === 0) {
      const nowH = new Date().getUTCHours();
      if (nowH >= 12) {
        lines.push("Revenue today is $0 so far while yesterday had recorded revenue — verify Stripe / webhooks.");
      }
    }
  } catch {
    /* skip revenue alerts if DB unavailable */
  }

  return { lines: lines.slice(0, 8) };
}
