/**
 * Read-only CRM aggregates — never persisted as broker expertise; advisory evidence only.
 */

import { prisma } from "@/lib/db";
import { extractEvaluationSnapshot } from "@/lib/leads/timeline-helpers";
import type { BrokerSpecializationPropertyType } from "./broker-profile.types";

export type BrokerObservedProfileSignals = {
  brokerId: string;
  observedServiceAreas: { city: string; leadCount: number }[];
  observedSpecializations: { propertyType: BrokerSpecializationPropertyType | "unknown"; leadCount: number }[];
  evidenceCounts: { leadsSampled: number; windowDays: number };
  confidenceNotes: string[];
};

function guessPropertyBucket(message: string, leadType: string | null): BrokerSpecializationPropertyType | "unknown" {
  const m = `${message} ${leadType ?? ""}`.toLowerCase();
  if (m.includes("rent") || m.includes("lease")) return "rental";
  if (m.includes("commercial") || m.includes("office")) return "commercial";
  if (m.includes("condo")) return "condo";
  if (m.includes("land") || m.includes("terrain")) return "land";
  if (m.includes("luxury")) return "luxury";
  if (m.includes("invest")) return "investor";
  if (m.includes("bnb") || m.includes("short-term") || m.includes("bnhub")) return "bnhub";
  if (m.includes("house") || m.includes("home") || m.includes("residential")) return "residential";
  return "unknown";
}

function reduceLeadsToObserved(brokerId: string, leads: ObservedLeadRow[], windowDays: number): BrokerObservedProfileSignals {
  const cityMap = new Map<string, number>();
  const specMap = new Map<BrokerSpecializationPropertyType | "unknown", number>();

  for (const l of leads) {
    const city = extractEvaluationSnapshot(l.aiExplanation)?.city?.trim();
    if (city) cityMap.set(city, (cityMap.get(city) ?? 0) + 1);
    const bucket = guessPropertyBucket(l.message, l.leadType);
    specMap.set(bucket, (specMap.get(bucket) ?? 0) + 1);
  }

  const observedServiceAreas = [...cityMap.entries()]
    .map(([city, leadCount]) => ({ city, leadCount }))
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 8);

  const observedSpecializations = [...specMap.entries()]
    .map(([propertyType, leadCount]) => ({ propertyType, leadCount }))
    .filter((x) => x.propertyType !== "unknown")
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 6);

  const confidenceNotes: string[] = [];
  if (leads.length < 6) {
    confidenceNotes.push("Thin CRM sample — observed hints are directional only.");
  } else {
    confidenceNotes.push("Observed counts are historical CRM touches — not a certification of expertise.");
  }

  return {
    brokerId,
    observedServiceAreas,
    observedSpecializations,
    evidenceCounts: { leadsSampled: leads.length, windowDays },
    confidenceNotes,
  };
}

type ObservedLeadRow = {
  aiExplanation: unknown;
  leadType: string | null;
  message: string;
};

export async function buildBrokerObservedProfileSignals(
  brokerId: string,
  options?: { windowDays?: number; maxLeads?: number },
): Promise<BrokerObservedProfileSignals> {
  const windowDays = Math.min(options?.windowDays ?? 90, 365);
  const maxLeads = Math.min(options?.maxLeads ?? 400, 800);
  const since = new Date(Date.now() - windowDays * 86400000);

  const leads = await prisma.lead.findMany({
    where: {
      OR: [{ introducedByBrokerId: brokerId }, { lastFollowUpByBrokerId: brokerId }],
      updatedAt: { gte: since },
    },
    select: { aiExplanation: true, leadType: true, message: true },
    take: maxLeads,
    orderBy: { updatedAt: "desc" },
  });

  return reduceLeadsToObserved(brokerId, leads, windowDays);
}

/** One query — aggregates per broker for routing pool (read-only). */
export async function buildObservedProfileSignalsForBrokers(
  brokerIds: string[],
  options?: { windowDays?: number; maxLeads?: number },
): Promise<Map<string, BrokerObservedProfileSignals>> {
  const out = new Map<string, BrokerObservedProfileSignals>();
  for (const id of brokerIds) {
    out.set(id, {
      brokerId: id,
      observedServiceAreas: [],
      observedSpecializations: [],
      evidenceCounts: { leadsSampled: 0, windowDays: options?.windowDays ?? 90 },
      confidenceNotes: ["No CRM rows in sample window."],
    });
  }
  if (brokerIds.length === 0) return out;

  const windowDays = Math.min(options?.windowDays ?? 90, 365);
  const maxLeads = Math.min(options?.maxLeads ?? 12000, 20000);
  const since = new Date(Date.now() - windowDays * 86400000);

  const leads = await prisma.lead.findMany({
    where: {
      updatedAt: { gte: since },
      OR: [{ introducedByBrokerId: { in: brokerIds } }, { lastFollowUpByBrokerId: { in: brokerIds } }],
    },
    select: {
      introducedByBrokerId: true,
      lastFollowUpByBrokerId: true,
      aiExplanation: true,
      leadType: true,
      message: true,
    },
    take: maxLeads,
    orderBy: { updatedAt: "desc" },
  });

  const buckets = new Map<string, ObservedLeadRow[]>();
  for (const id of brokerIds) buckets.set(id, []);

  function push(bid: string | null, row: ObservedLeadRow) {
    if (!bid || !buckets.has(bid)) return;
    buckets.get(bid)!.push(row);
  }

  for (const row of leads) {
    const slim: ObservedLeadRow = {
      aiExplanation: row.aiExplanation,
      leadType: row.leadType,
      message: row.message,
    };
    push(row.introducedByBrokerId, slim);
    if (row.lastFollowUpByBrokerId && row.lastFollowUpByBrokerId !== row.introducedByBrokerId) {
      push(row.lastFollowUpByBrokerId, slim);
    }
  }

  for (const id of brokerIds) {
    const arr = buckets.get(id) ?? [];
    out.set(id, reduceLeadsToObserved(id, arr, windowDays));
  }

  return out;
}
