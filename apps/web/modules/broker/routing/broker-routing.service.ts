/**
 * Advisory lead routing summary — read-only; does not assign brokers or mutate leads.
 */

import { prisma } from "@/lib/db";
import { buildBrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.service";
import type { BrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.types";
import { normalizeRoutingInputs } from "./broker-routing-normalizer.service";
import type { NormalizedRoutingBroker, NormalizedRoutingLead } from "./broker-routing-normalizer.service";
import { buildBrokerRoutingWhy } from "./broker-routing-explainer.service";
import { classifyBrokerRoutingFit } from "./broker-routing-status.service";
import { rankBrokerRoutingCandidates } from "./broker-routing-ranker.service";
import { recordRoutingSummaryBuilt } from "./broker-routing-monitoring.service";
import type {
  BrokerRoutingCandidate,
  BrokerRoutingScoreBreakdown,
  LeadRoutingSummary,
} from "./broker-routing.types";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function overallRankScore(b: BrokerRoutingScoreBreakdown): number {
  const v =
    b.regionFitScore * 0.22 +
    b.intentFitScore * 0.18 +
    b.performanceFitScore * 0.24 +
    b.responseFitScore * 0.2 +
    b.availabilityFitScore * 0.16;
  return Math.round(clamp(v, 0, 100));
}

/** Exported for unit tests — deterministic sub-scores. */
export function computeRoutingBreakdown(
  lead: NormalizedRoutingLead,
  broker: NormalizedRoutingBroker,
  performance: BrokerPerformanceSummary | null,
  activeLeadCount: number,
): BrokerRoutingScoreBreakdown {
  let regionFitScore = 48;
  if (lead.regionKey) {
    if (broker.regionKeys.length === 0) regionFitScore = 46;
    else {
      const hit = broker.regionKeys.some((k) => {
        if (!k) return false;
        return (
          lead.regionKey.includes(k) ||
          k.includes(lead.regionKey) ||
          lead.regionKey.split(" ").some((w) => w.length > 3 && k.includes(w))
        );
      });
      regionFitScore = hit ? 86 : 52;
    }
  } else {
    regionFitScore = 44;
  }

  let intentFitScore = 50;
  const persona = (broker.launchPersonaChoice ?? "").toLowerCase();
  const seg = (broker.growthOutreachSegment ?? "").toLowerCase();
  const intent = lead.intent;
  if (intent === "invest" && (persona === "invest" || seg.includes("invest"))) intentFitScore = 86;
  else if (intent === "buy" && (persona === "find" || persona === "invest")) intentFitScore = 74;
  else if (intent === "rent" && (seg.includes("rent") || seg.includes("lease"))) intentFitScore = 72;
  else if (intent === "buy") intentFitScore = 58;
  else intentFitScore = 52;

  const performanceFitScore = clamp(performance?.overallScore ?? 48, 0, 100);
  const responseFitScore = clamp(performance?.breakdown.responseSpeedScore ?? 48, 0, 100);

  let availabilityFitScore = 72;
  if (activeLeadCount > 40) availabilityFitScore = 36;
  else if (activeLeadCount > 25) availabilityFitScore = 48;
  else if (activeLeadCount > 15) availabilityFitScore = 58;
  else if (activeLeadCount > 8) availabilityFitScore = 66;

  return {
    regionFitScore: clamp(regionFitScore, 0, 100),
    intentFitScore: clamp(intentFitScore, 0, 100),
    performanceFitScore,
    responseFitScore,
    availabilityFitScore: clamp(availabilityFitScore, 0, 100),
  };
}

async function activeLeadCountsByBroker(brokerIds: string[]): Promise<Map<string, number>> {
  const since = new Date(Date.now() - 30 * 86400000);
  const m = new Map<string, Set<string>>();
  for (const id of brokerIds) m.set(id, new Set());
  if (brokerIds.length === 0) return new Map();

  const rows = await prisma.lead.findMany({
    where: {
      updatedAt: { gte: since },
      OR: [{ introducedByBrokerId: { in: brokerIds } }, { lastFollowUpByBrokerId: { in: brokerIds } }],
    },
    select: { id: true, introducedByBrokerId: true, lastFollowUpByBrokerId: true },
    take: 8000,
  });

  for (const r of rows) {
    if (r.introducedByBrokerId && m.has(r.introducedByBrokerId)) {
      m.get(r.introducedByBrokerId)!.add(r.id);
    }
    if (r.lastFollowUpByBrokerId && m.has(r.lastFollowUpByBrokerId)) {
      m.get(r.lastFollowUpByBrokerId)!.add(r.id);
    }
  }
  return new Map([...m.entries()].map(([id, set]) => [id, set.size]));
}

async function loadPerformanceMap(brokerIds: string[]): Promise<Map<string, BrokerPerformanceSummary | null>> {
  const map = new Map<string, BrokerPerformanceSummary | null>();
  const chunk = 12;
  for (let i = 0; i < brokerIds.length; i += chunk) {
    const part = brokerIds.slice(i, i + chunk);
    const rows = await Promise.all(
      part.map(async (id) => {
        const s = await buildBrokerPerformanceSummary(id);
        return [id, s] as const;
      }),
    );
    for (const [id, s] of rows) map.set(id, s);
  }
  return map;
}

export async function buildLeadRoutingSummary(leadId: string): Promise<LeadRoutingSummary | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      message: true,
      purchaseRegion: true,
      leadType: true,
      aiExplanation: true,
      score: true,
    },
  });
  if (!lead) return null;

  const brokers = await prisma.user.findMany({
    where: { role: "BROKER" },
    select: {
      id: true,
      name: true,
      homeCity: true,
      homeRegion: true,
      launchPersonaChoice: true,
      growthOutreachSegment: true,
    },
    orderBy: { id: "asc" },
    take: 100,
  });

  const brokerIds = brokers.map((b) => b.id);
  const perfMap = await loadPerformanceMap(brokerIds);
  const activeMap = await activeLeadCountsByBroker(brokerIds);
  const normalized = normalizeRoutingInputs(lead, brokers, perfMap);

  const routingNotes: string[] = [];
  if (!normalized.lead.regionKey) {
    routingNotes.push("Lead region/city signals are thin — treat regional fit as low confidence.");
  }
  if (brokers.length === 0) {
    routingNotes.push("No broker accounts in pool.");
  }

  const candidates: BrokerRoutingCandidate[] = [];

  for (const nb of normalized.brokers) {
    const perf = perfMap.get(nb.brokerId) ?? null;
    const active = activeMap.get(nb.brokerId) ?? 0;
    const breakdown = computeRoutingBreakdown(normalized.lead, nb, perf, active);
    const rankScore = overallRankScore(breakdown);
    const fitBand = classifyBrokerRoutingFit(rankScore);
    const why = buildBrokerRoutingWhy({ lead: normalized.lead, broker: nb, breakdown });
    candidates.push({
      brokerId: nb.brokerId,
      brokerName: nb.name,
      rankScore,
      fitBand,
      breakdown,
      why,
    });
  }

  const ranked = rankBrokerRoutingCandidates(candidates);
  const top = ranked[0];
  if (top && top.rankScore < 55) {
    routingNotes.push("Top candidate score is modest — separation between brokers is weak in this snapshot.");
  }
  if (top && top.fitBand === "strong") {
    routingNotes.push("At least one high-fit candidate in-model — still advisory; no assignment.");
  }

  recordRoutingSummaryBuilt({
    candidateCount: candidates.length,
    strongCandidates: ranked.filter((c) => c.fitBand === "strong").length,
    weakTopScore: top != null && top.rankScore < 55,
    missingRegion: !normalized.lead.regionKey,
  });

  return {
    leadId: lead.id,
    topCandidates: ranked,
    routingNotes,
    createdAt: new Date().toISOString(),
  };
}
