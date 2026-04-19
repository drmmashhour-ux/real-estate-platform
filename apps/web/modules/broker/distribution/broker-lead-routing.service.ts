/**
 * Fair routing scores on top of Smart Routing V1 — deterministic adjustments + explanations.
 */

import { prisma } from "@/lib/db";
import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import {
  brokerAvailabilityRoutingFlags,
  brokerServiceProfileFlags,
  leadGeoRoutingFlags,
} from "@/config/feature-flags";
import { computeGeoMatch } from "@/modules/broker/distribution/broker-geo-match.service";
import { recordLeadGeoRouting } from "@/modules/lead/lead-geo-enrichment-monitoring.service";
import type { BrokerRoutingCandidate } from "@/modules/broker/routing/broker-routing.types";
import { buildLeadRoutingSummary } from "@/modules/broker/routing/broker-routing.service";
import type { BrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.types";
import { buildBrokerPerformanceSummary } from "@/modules/broker/performance/broker-performance.service";
import { buildProfileConfidenceAndMergeNotes } from "@/modules/broker/profile/broker-profile-confidence.service";
import { buildObservedProfileSignalsForBrokers } from "@/modules/broker/profile/broker-observed-profile-signals.service";
import {
  computeProfileRoutingBonus,
  inferLeadIntentCategory,
  inferPropertyBucketFromLead,
} from "@/modules/broker/profile/broker-profile-routing-bonus.service";
import { emptyStoredProfile } from "@/modules/broker/profile/broker-profile-payload";
import {
  getDeclaredStoredProfilesByBrokerIds,
} from "@/modules/broker/profile/broker-service-profile.service";
import { recordRoutingUsedProfile } from "@/modules/broker/profile/broker-service-profile-monitoring.service";
import type {
  BrokerLeadRoutingCandidate,
  BrokerLeadRoutingConfidenceLevel,
  BrokerLeadRoutingDecision,
} from "./broker-lead-distribution.types";
import type { BrokerRoutingAvailabilitySummary } from "@/modules/broker/availability/broker-availability.types";
import {
  availabilityRoutingSparseHint,
  buildLeadLevelRoutingSignals,
  loadLeadForRoutingSignals,
} from "./broker-routing-signals.service";
import { buildBrokerAvailabilitySnapshot } from "@/modules/broker/availability/broker-availability.service";
import { buildBrokerCapacitySnapshot } from "@/modules/broker/availability/broker-capacity.service";
import { buildBrokerSlaSnapshot } from "@/modules/broker/availability/broker-sla.service";
import { mergeBrokerRoutingAvailabilitySummary } from "@/modules/broker/availability/broker-routing-availability-merge.service";
import { recordBrokerRoutingRecommendationUsedSignals } from "@/modules/broker/availability/broker-availability-monitoring.service";
import { recordBrokerLeadDistributionDecision } from "./broker-lead-distribution-monitoring.service";

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function confidenceFromRouting(
  rankScore: number,
  sparseLead: boolean,
  adjustmentSeverity: number,
): BrokerLeadRoutingConfidenceLevel {
  if (sparseLead && rankScore < 62) return "insufficient";
  if (adjustmentSeverity >= 22) return "low";
  if (rankScore >= 78 && adjustmentSeverity < 8) return "high";
  if (rankScore >= 62) return "medium";
  return "low";
}

/** Max routing points from geo alignment — capped so performance + fairness stay primary. */
const GEO_ROUTING_WEIGHT_POINTS = 6;

function strengthsFromBreakdown(c: BrokerRoutingCandidate): string[] {
  const b = c.breakdown;
  const out: string[] = [];
  if (b.regionFitScore >= 78) out.push("Relevant location coverage");
  if (b.performanceFitScore >= 72) out.push("Strong recent performance telemetry");
  if (b.responseFitScore >= 72) out.push("Strong follow-up / response signals");
  if (b.availabilityFitScore >= 68) out.push("Lower current lead load vs peers");
  if (b.intentFitScore >= 72) out.push("Intent alignment with broker profile");
  return out.slice(0, 4);
}

async function assignmentEventsLastDays(days: number): Promise<Map<string, number>> {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.leadTimelineEvent.findMany({
    where: {
      createdAt: { gte: since },
      eventType: {
        in: ["lead_distribution_assign", "smart_routing_v2_manual_assign", "smart_routing_v2_auto_assign"],
      },
    },
    select: { payload: true },
    take: 8000,
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    const p = r.payload as Record<string, unknown> | null | undefined;
    const bid = typeof p?.brokerId === "string" ? p.brokerId : null;
    if (bid) m.set(bid, (m.get(bid) ?? 0) + 1);
  }
  return m;
}

async function activeLeadCountsFor(ids: string[]): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, 0);
  if (ids.length === 0) return m;
  const since30 = new Date(Date.now() - 30 * 86400000);
  const rows = await prisma.lead.findMany({
    where: {
      updatedAt: { gte: since30 },
      OR: [{ introducedByBrokerId: { in: ids } }, { lastFollowUpByBrokerId: { in: ids } }],
    },
    select: { id: true, introducedByBrokerId: true, lastFollowUpByBrokerId: true },
    take: 12000,
  });
  const sets = new Map<string, Set<string>>();
  for (const id of ids) sets.set(id, new Set());
  for (const r of rows) {
    if (r.introducedByBrokerId && sets.has(r.introducedByBrokerId)) {
      sets.get(r.introducedByBrokerId)!.add(r.id);
    }
    if (r.lastFollowUpByBrokerId && sets.has(r.lastFollowUpByBrokerId)) {
      sets.get(r.lastFollowUpByBrokerId)!.add(r.id);
    }
  }
  return new Map([...sets.entries()].map(([id, set]) => [id, set.size]));
}

async function performanceForBrokers(ids: string[]): Promise<Map<string, BrokerPerformanceSummary | null>> {
  const map = new Map<string, BrokerPerformanceSummary | null>();
  const chunk = 10;
  for (let i = 0; i < ids.length; i += chunk) {
    const part = ids.slice(i, i + chunk);
    const rows = await Promise.all(
      part.map(async (id) => {
        const s = await buildBrokerPerformanceSummary(id, { emitMonitoring: false });
        return [id, s] as const;
      }),
    );
    for (const [id, s] of rows) map.set(id, s);
  }
  return map;
}

export type DistributionRoutingOptions = {
  poolSize?: number;
  topCandidates?: number;
};

/**
 * Builds an explainable routing decision — does not assign brokers.
 */
export async function buildBrokerLeadRoutingDecision(
  leadId: string,
  options?: DistributionRoutingOptions,
): Promise<BrokerLeadRoutingDecision | null> {
  const poolSize = Math.min(options?.poolSize ?? 48, 120);
  const topK = Math.min(options?.topCandidates ?? 3, 12);

  const leadRow = await loadLeadForRoutingSignals(leadId);
  if (!leadRow) return null;

  const leadSignalsPack = buildLeadLevelRoutingSignals(leadRow);
  const { sparseNotes } = leadSignalsPack;
  const sparseLeadResolved =
    leadSignalsPack.signals.confidenceLevel === "insufficient" ||
    leadSignalsPack.signals.confidenceLevel === "low";

  const summary = await buildLeadRoutingSummary(leadId, { topN: poolSize });
  if (!summary) return null;

  const candidateIds = summary.topCandidates.map((c) => c.brokerId);

  const snap = extractEvaluationSnapshot(leadRow.aiExplanation);
  const leadCtx = {
    city: leadSignalsPack.signals.city ?? null,
    area: leadSignalsPack.signals.area ?? null,
    propertyTypeBucket: inferPropertyBucketFromLead(snap?.propertyType ?? null),
    intentCategory: inferLeadIntentCategory(leadRow.leadType, leadRow.message),
    leadLocale: leadRow.user?.preferredUiLocale ?? null,
  };

  const loadDeclaredProfiles =
    brokerServiceProfileFlags.brokerSpecializationRoutingV1 || leadGeoRoutingFlags.geoRoutingV1;

  const rfAvail = {
    availability: brokerAvailabilityRoutingFlags.brokerAvailabilityRoutingV1,
    capacity: brokerAvailabilityRoutingFlags.brokerCapacityRoutingV1,
    sla: brokerAvailabilityRoutingFlags.brokerSlaRoutingV1,
  };
  const anyAvailabilityRouting = rfAvail.availability || rfAvail.capacity || rfAvail.sla;

  const [assignVelocity, activeMap, perfMap, declaredMap, observedMap] = await Promise.all([
    assignmentEventsLastDays(14),
    activeLeadCountsFor(candidateIds),
    performanceForBrokers(candidateIds),
    loadDeclaredProfiles
      ? getDeclaredStoredProfilesByBrokerIds(candidateIds)
      : Promise.resolve(new Map()),
    brokerServiceProfileFlags.brokerSpecializationRoutingV1
      ? buildObservedProfileSignalsForBrokers(candidateIds, { windowDays: 90 })
      : Promise.resolve(new Map()),
  ]);

  const suppressedBrokerIds: string[] = [];
  type Row = { candidate: BrokerLeadRoutingCandidate; suppressed: boolean };

  const rows: Row[] = [];
  let routingSignalsUsageRecorded = false;

  for (const c of summary.topCandidates) {
    const perf = perfMap.get(c.brokerId) ?? null;
    const active = activeMap.get(c.brokerId) ?? 0;
    const velocity = assignVelocity.get(c.brokerId) ?? 0;

    let score = c.rankScore;
    const reasons: string[] = [...c.why];
    const risks: string[] = [];
    let adjustment = 0;

    const velPen = Math.min(14, velocity * 3);
    if (velPen > 0) {
      adjustment += velPen;
      score -= velPen;
      reasons.push(
        `Fairness: recent internal assignment velocity (${velocity} in 14d) — slight de-prioritization to spread load.`,
      );
    }

    const loadPen = active > 40 ? 14 : active > 28 ? 10 : active > 18 ? 5 : 0;
    if (loadPen > 0) {
      adjustment += loadPen;
      score -= loadPen;
      reasons.push(`Load balancing: higher 30d active CRM touch volume (${active}) vs peers in pool.`);
    }

    if (perf?.weakSignals.length) {
      for (const w of perf.weakSignals.slice(0, 2)) {
        risks.push(w);
      }
      const debt = perf.weakSignals.filter(
        (x) => x.toLowerCase().includes("follow") || x.toLowerCase().includes("due"),
      );
      if (debt.length > 0) {
        adjustment += 8;
        score -= 8;
        reasons.push("Follow-up / discipline strain in CRM summary — routing score tempered (not a hard block).");
      }
    }

    let profileHints: BrokerLeadRoutingCandidate["profileHints"];
    let geoHints: BrokerLeadRoutingCandidate["geoHints"];
    const declared = declaredMap.get(c.brokerId) ?? emptyStoredProfile();

    if (brokerServiceProfileFlags.brokerSpecializationRoutingV1) {
      const { profileConfidence } = buildProfileConfidenceAndMergeNotes(declared);
      const observed = observedMap.get(c.brokerId) ?? null;
      const bonus = computeProfileRoutingBonus({
        declared,
        observed,
        leadCtx,
        profileConfidence,
        activeLeadCount: active,
      });
      score = clamp(Math.round(score + bonus.delta), 0, 100);
      if (bonus.reasons.length) reasons.push(...bonus.reasons.slice(0, 5));
      profileHints = bonus.hints;
      try {
        recordRoutingUsedProfile({ sparse: profileConfidence === "low" });
      } catch {
        /* noop */
      }
    }

    if (leadGeoRoutingFlags.geoRoutingV1) {
      const geo = computeGeoMatch(leadSignalsPack.leadLocation, declared.serviceAreas);
      const geoPts = Math.round(GEO_ROUTING_WEIGHT_POINTS * geo.geoScore);
      score = clamp(Math.round(score + geoPts), 0, 100);
      reasons.push(`Geo: ${geo.explanation}`);
      geoHints = {
        matchType: geo.matchType,
        geoScore: geo.geoScore,
        explanation: geo.explanation,
      };
    }

    let routingAvailability: BrokerRoutingAvailabilitySummary | null = null;
    if (anyAvailabilityRouting) {
      routingAvailability = mergeBrokerRoutingAvailabilitySummary({
        brokerId: c.brokerId,
        flags: rfAvail,
        availability: rfAvail.availability
          ? buildBrokerAvailabilitySnapshot({
              brokerId: c.brokerId,
              profileLoaded: loadDeclaredProfiles,
              stored: loadDeclaredProfiles ? (declaredMap.get(c.brokerId) ?? emptyStoredProfile()) : null,
            })
          : null,
        capacity: rfAvail.capacity
          ? buildBrokerCapacitySnapshot({
              brokerId: c.brokerId,
              activeLeads: active,
              overdueFollowUps: perf
                ? perf.weakSignals.filter((w) => /follow|due|idle|attention/i.test(w.toLowerCase())).length
                : 0,
              recentAssignments: velocity,
              maxActiveLeadsHint: loadDeclaredProfiles
                ? (declaredMap.get(c.brokerId) ?? emptyStoredProfile()).capacity.maxActiveLeads ?? null
                : null,
              preferredRange: loadDeclaredProfiles
                ? (declaredMap.get(c.brokerId) ?? emptyStoredProfile()).capacity.preferredActiveRange ?? null
                : null,
              sparseFallback: !loadDeclaredProfiles,
            })
          : null,
        sla: rfAvail.sla ? buildBrokerSlaSnapshot({ brokerId: c.brokerId, performanceSummary: perf }) : null,
      });
    }

    if (routingAvailability) {
      score = clamp(Math.round(score + routingAvailability.routingAdjustment), 0, 100);
      reasons.push(...routingAvailability.reasons.slice(0, 6));
      adjustment += Math.abs(routingAvailability.routingAdjustment);
      if (!routingSignalsUsageRecorded) {
        routingSignalsUsageRecorded = true;
        try {
          recordBrokerRoutingRecommendationUsedSignals();
        } catch {
          /* noop */
        }
      }
    }

    score = clamp(Math.round(score), 0, 100);

    const conf = confidenceFromRouting(score, sparseLeadResolved, adjustment);

    const strengths = strengthsFromBreakdown(c);

    const suppressed = score < 38 && (risks.length >= 2 || velPen >= 9);
    if (suppressed) {
      suppressedBrokerIds.push(c.brokerId);
      risks.push("Held back from top suggestions — elevated routing fairness penalties in this snapshot.");
    }

    rows.push({
      candidate: {
        brokerId: c.brokerId,
        displayName: (c.brokerName ?? "Broker").slice(0, 120),
        routingScore: score,
        confidenceLevel: conf,
        reasons,
        strengths,
        risks: risks.slice(0, 5),
        profileHints,
        geoHints,
        routingAvailability: routingAvailability ?? undefined,
      },
      suppressed,
    });
  }

  rows.sort((a, b) => {
    if (Number(a.suppressed) !== Number(b.suppressed)) return Number(a.suppressed) - Number(b.suppressed);
    if (b.candidate.routingScore !== a.candidate.routingScore) return b.candidate.routingScore - a.candidate.routingScore;
    return a.candidate.brokerId.localeCompare(b.candidate.brokerId);
  });

  let candidatesOrdered = rows.filter((r) => !r.suppressed);
  let strictGeoReorder = false;
  if (leadGeoRoutingFlags.strictGeoRoutingV1 && leadGeoRoutingFlags.geoRoutingV1) {
    const strongGeo = candidatesOrdered.filter((r) => {
      const t = r.candidate.geoHints?.matchType;
      return t === "exact_city" || t === "area_match";
    });
    if (strongGeo.length > 0) {
      const rest = candidatesOrdered.filter((r) => !strongGeo.includes(r));
      strongGeo.sort((a, b) => b.candidate.routingScore - a.candidate.routingScore);
      rest.sort((a, b) => b.candidate.routingScore - a.candidate.routingScore);
      candidatesOrdered = [...strongGeo, ...rest];
      strictGeoReorder = true;
    }
  }

  const top = candidatesOrdered.map((r) => r.candidate).slice(0, topK);

  try {
    recordLeadGeoRouting({
      matchType: top[0]?.geoHints?.matchType ?? "none",
      fallback: (top[0]?.geoHints?.matchType ?? "none") === "none",
      strictPool: strictGeoReorder,
    });
  } catch {
    /* noop */
  }

  const recommended = top[0];

  const routingNotes = [...summary.routingNotes, ...sparseNotes];
  const availSparse = availabilityRoutingSparseHint(loadDeclaredProfiles);
  if (availSparse && anyAvailabilityRouting) routingNotes.push(availSparse);
  if (leadSignalsPack.signals.geoExplanation) {
    routingNotes.unshift(String(leadSignalsPack.signals.geoExplanation));
  }
  const explanation = [
    `Recommendation-first: blends region, intent, performance, response, and availability from Smart Routing V1, then applies transparent fairness adjustments (assignment velocity + pipeline load + discipline hints)${
      brokerServiceProfileFlags.brokerSpecializationRoutingV1
        ? ", plus capped explicit broker profile signals when enabled."
        : "."
    }${
      leadGeoRoutingFlags.geoRoutingV1
        ? " Geo alignment adds capped points from declared service areas; sparse lead locations degrade gracefully."
        : ""
    }${
      leadGeoRoutingFlags.strictGeoRoutingV1 && leadGeoRoutingFlags.geoRoutingV1
        ? " Strict geo mode surfaces same-city / area brokers first when available."
        : ""
    }${
      anyAvailabilityRouting
        ? " Optional availability/capacity/SLA layers apply soft score deltas only — no automatic assignment or external send."
        : ""
    }`,
    recommended
      ? `Top suggestion: ${recommended.displayName} (routing score ${recommended.routingScore}, confidence ${recommended.confidenceLevel}).`
      : "No broker cleared optional fairness gates — use manual assignment.",
  ].join(" ");

  const decision: BrokerLeadRoutingDecision = {
    leadId,
    selectedBrokerId: leadRow.introducedByBrokerId ?? undefined,
    candidateRows: top,
    decisionMode: leadRow.introducedByBrokerId ? "manual" : "recommended",
    explanation,
    recommendedBrokerId: recommended?.brokerId,
    routingNotes,
    sparseDataNotes: sparseNotes,
    suppressedBrokerIds: suppressedBrokerIds.length ? suppressedBrokerIds : undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    recordBrokerLeadDistributionDecision({
      candidateCount: top.length,
      sparse: sparseLeadResolved,
      suppressed: suppressedBrokerIds.length,
      hasAssignment: Boolean(leadRow.introducedByBrokerId),
    });
  } catch {
    /* noop */
  }

  return decision;
}
