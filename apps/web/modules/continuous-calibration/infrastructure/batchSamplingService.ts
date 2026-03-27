import type { FsboListingOwnerType } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { ModelValidationItem } from "@prisma/client";
import { computeAllAgreements } from "@/modules/model-validation/infrastructure/agreementService";
import type { CompositionTargets, ListingSegmentJson } from "../domain/calibration.types";

export type CollectedValidationRow = {
  entityType: string;
  entityId: string;
  sourceRunId: string;
  humanTrustLabel: string | null;
  humanDealLabel: string | null;
  humanRiskLabel: string | null;
  fairnessRating: number | null;
  needsManualReview: boolean | null;
  notes: string | null;
  priority: number;
  bucket: "strong" | "average" | "weak" | "suspicious";
};

function trustBucketFromItem(i: ModelValidationItem): "strong" | "average" | "weak" | "suspicious" {
  const t = i.predictedTrustScore;
  const r = i.predictedFraudScore;
  if (r != null && r >= 55) return "suspicious";
  if (t == null) return "weak";
  if (t >= 70) return "strong";
  if (t >= 40) return "average";
  return "weak";
}

function priorityScore(i: ModelValidationItem): number {
  let p = 0;
  const a = computeAllAgreements({
    predictedTrustScore: i.predictedTrustScore,
    predictedRecommendation: i.predictedRecommendation,
    predictedFraudScore: i.predictedFraudScore,
    humanTrustLabel: i.humanTrustLabel,
    humanDealLabel: i.humanDealLabel,
    humanRiskLabel: i.humanRiskLabel,
  });
  if (a.agreementTrust === false || a.agreementDeal === false || a.agreementRisk === false) p += 100;
  if ((i.predictedFraudScore ?? 0) >= 50) p += 40;
  const tc = i.predictedTrustConfidence;
  const dc = i.predictedDealConfidence;
  if ((tc != null && tc < 40) || (dc != null && dc < 40)) p += 25;
  return p;
}

function isFullyLabeled(i: ModelValidationItem): boolean {
  return Boolean(
    i.humanTrustLabel?.trim() && i.humanDealLabel?.trim() && i.humanRiskLabel?.trim(),
  );
}

function toRow(item: ModelValidationItem, priority: number, bucket: CollectedValidationRow["bucket"]): CollectedValidationRow {
  return {
    entityType: item.entityType,
    entityId: item.entityId,
    sourceRunId: item.runId,
    humanTrustLabel: item.humanTrustLabel,
    humanDealLabel: item.humanDealLabel,
    humanRiskLabel: item.humanRiskLabel,
    fairnessRating: item.fairnessRating,
    needsManualReview: item.needsManualReview,
    notes: item.reviewerNotes,
    priority,
    bucket,
  };
}

/**
 * Pull fully labeled validation items from runs, dedupe by entity, prioritize disagreements / risk / low confidence.
 * Optional composition targets fill buckets (strong / average / weak / suspicious) before topping up by priority.
 */
export async function collectLabeledItemsFromValidationRuns(
  db: PrismaClient,
  input: {
    runIds: string[];
    targetMin: number;
    targetMax: number;
    composition?: Partial<CompositionTargets> | null;
  },
): Promise<CollectedValidationRow[]> {
  if (!input.runIds.length) return [];

  const raw = await db.modelValidationItem.findMany({
    where: { runId: { in: input.runIds } },
    orderBy: { updatedAt: "desc" },
  });

  const byKey = new Map<string, ModelValidationItem>();
  for (const row of raw) {
    if (!isFullyLabeled(row)) continue;
    const k = `${row.entityType}::${row.entityId}`;
    if (!byKey.has(k)) byKey.set(k, row);
  }

  const enriched = [...byKey.values()].map((item) => ({
    item,
    priority: priorityScore(item),
    bucket: trustBucketFromItem(item),
  }));

  enriched.sort((a, b) => b.priority - a.priority);

  const max = Math.max(0, input.targetMax);
  const min = Math.min(input.targetMin, max);

  const useComp = Boolean(
    input.composition &&
      (input.composition.strong ||
        input.composition.average ||
        input.composition.weakIncomplete ||
        input.composition.suspicious),
  );

  const defaultComp: CompositionTargets = {
    strong: 15,
    average: 15,
    weakIncomplete: 10,
    suspicious: 10,
  };
  const comp = useComp ? { ...defaultComp, ...input.composition } : null;

  const buckets: Record<CollectedValidationRow["bucket"], CollectedValidationRow[]> = {
    strong: [],
    average: [],
    weak: [],
    suspicious: [],
  };

  for (const e of enriched) {
    buckets[e.bucket].push(toRow(e.item, e.priority, e.bucket));
  }

  const picked: CollectedValidationRow[] = [];
  const used = new Set<string>();

  const takeFrom = (rows: CollectedValidationRow[], limit: number) => {
    for (const r of rows) {
      if (picked.length >= max || limit <= 0) break;
      const k = `${r.entityType}::${r.entityId}`;
      if (used.has(k)) continue;
      used.add(k);
      picked.push(r);
      limit--;
    }
  };

  if (comp) {
    takeFrom(buckets.strong, comp.strong ?? 0);
    takeFrom(buckets.average, comp.average ?? 0);
    takeFrom(buckets.weak, comp.weakIncomplete ?? 0);
    takeFrom(buckets.suspicious, comp.suspicious ?? 0);
  }

  for (const e of enriched) {
    if (picked.length >= max) break;
    const r = toRow(e.item, e.priority, e.bucket);
    const k = `${r.entityType}::${r.entityId}`;
    if (used.has(k)) continue;
    used.add(k);
    picked.push(r);
  }

  if (picked.length < min && enriched.length >= min) {
    const fallback = enriched.slice(0, Math.min(max, enriched.length)).map((e) => toRow(e.item, e.priority, e.bucket));
    return fallback;
  }

  return picked.slice(0, max);
}

export function buildListingSegmentJson(listing: {
  propertyType: string | null;
  listingDealType: string;
  tenantId: string | null;
  listingOwnerType: FsboListingOwnerType;
  city: string;
}): ListingSegmentJson {
  const pt = (listing.propertyType ?? "").toUpperCase();
  let propertyKind: ListingSegmentJson["propertyKind"] = "other";
  if (pt.includes("CONDO")) propertyKind = "condo";
  else if (pt.includes("SINGLE") || pt.includes("FAMILY") || pt.includes("TOWNHOUSE") || pt.includes("HOUSE")) {
    propertyKind = "house";
  }
  const rental = listing.listingDealType !== "SALE";
  const bnhub = listing.tenantId != null;
  const brokerListed = listing.listingOwnerType === "BROKER";
  return {
    propertyKind,
    rental,
    bnhub,
    brokerListed,
    city: listing.city,
  };
}

export function segmentKey(s: ListingSegmentJson): string {
  return `${s.propertyKind}|${s.rental ? "rent" : "sale"}|${s.bnhub ? "bnhub" : "direct"}|${s.brokerListed ? "broker" : "owner"}`;
}
