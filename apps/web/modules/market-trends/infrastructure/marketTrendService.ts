import type { MarketSnapshot, PrismaClient } from "@prisma/client";
import type { MarketTrendSummary, TrendDirectionLabel } from "../domain/trendTypes";
import { confidenceFromSampleSize } from "./trendConfidenceService";

export type MarketSnapshotPublicDto = {
  snapshotDate: string;
  medianPriceCents: string | null;
  activeListingCount: number;
  newListingCount: number;
  analysisWindowDays: number;
  confidenceLevel: string;
};

function snapshotToDto(s: MarketSnapshot): MarketSnapshotPublicDto {
  return {
    snapshotDate: s.snapshotDate.toISOString().slice(0, 10),
    medianPriceCents: s.medianPriceCents != null ? s.medianPriceCents.toString() : null,
    activeListingCount: s.activeListingCount,
    newListingCount: s.newListingCount,
    analysisWindowDays: s.analysisWindowDays,
    confidenceLevel: s.confidenceLevel,
  };
}

/**
 * Compare two snapshots (older vs newer) for median price movement — conservative directional hint only.
 */
export function directionFromMedians(args: {
  olderMedianCents: bigint | number | null;
  newerMedianCents: bigint | number | null;
  olderConfidence: string;
  newerConfidence: string;
  activeListingCount: number;
  windowDays: number;
}): MarketTrendSummary {
  const warnings: string[] = [];
  const conf = confidenceFromSampleSize(args.activeListingCount, args.windowDays);
  if (conf === "insufficient_data" || args.olderConfidence === "insufficient_data" || args.newerConfidence === "insufficient_data") {
    return {
      direction: "insufficient_data",
      confidence: "insufficient_data",
      safeSummary: "Market direction uncertain — not enough comparable listing data for this window.",
      warnings: ["data coverage is weak", "trend confidence is low"],
    };
  }

  if (args.olderMedianCents == null || args.newerMedianCents == null) {
    return {
      direction: "insufficient_data",
      confidence: "low",
      safeSummary: "Market appears stable from available snapshots; median price series is incomplete.",
      warnings: ["region signal is mixed"],
    };
  }

  const o = Number(args.olderMedianCents);
  const n = Number(args.newerMedianCents);
  if (!Number.isFinite(o) || !Number.isFinite(n) || o <= 0) {
    return {
      direction: "insufficient_data",
      confidence: "low",
      safeSummary: "Market direction uncertain — baseline median is not reliable.",
      warnings: ["data coverage is weak"],
    };
  }

  const delta = (n - o) / o;
  let direction: TrendDirectionLabel = "neutral";
  if (delta > 0.02) direction = "upward_pressure";
  else if (delta < -0.02) direction = "downward_pressure";

  if (conf === "low") warnings.push("trend confidence is low");
  if (Math.abs(delta) < 0.01) warnings.push("region signal is mixed");

  const safeSummary =
    direction === "upward_pressure"
      ? "Recent comparable pressure is upward — use as context only; not an appraisal."
      : direction === "downward_pressure"
        ? "Recent comparable pressure is downward — use as context only; not an appraisal."
        : "Market appears stable — directional change is within the neutral band.";

  return {
    direction,
    confidence: conf,
    safeSummary,
    warnings,
  };
}

/** Compare two snapshots (older vs newer) for conservative directional signal. */
export function summarizeTrendFromSnapshots(
  newer: Pick<
    MarketSnapshot,
    "medianPriceCents" | "confidenceLevel" | "activeListingCount" | "analysisWindowDays"
  >,
  older: Pick<
    MarketSnapshot,
    "medianPriceCents" | "confidenceLevel" | "activeListingCount" | "analysisWindowDays"
  >
): MarketTrendSummary {
  return directionFromMedians({
    olderMedianCents: older.medianPriceCents,
    newerMedianCents: newer.medianPriceCents,
    olderConfidence: older.confidenceLevel,
    newerConfidence: newer.confidenceLevel,
    activeListingCount: newer.activeListingCount,
    windowDays: newer.analysisWindowDays,
  });
}

export async function getRegionMarketTrendSummary(
  db: PrismaClient,
  args: { regionSlug: string; propertyType: string; mode: string; windowDays: number }
): Promise<{
  summary: MarketTrendSummary;
  newerSnapshot: MarketSnapshotPublicDto | null;
  olderSnapshot: MarketSnapshotPublicDto | null;
}> {
  const snaps = await loadLatestSnapshotsForRegion(db, { ...args, take: 2 });
  if (snaps.length < 2) {
    return {
      summary: {
        direction: "insufficient_data",
        confidence: "insufficient_data",
        safeSummary: "Market direction uncertain — need at least two snapshots over time for this region.",
        warnings: ["data coverage is weak", "trend confidence is low"],
      },
      newerSnapshot: snaps[0] ? snapshotToDto(snaps[0]) : null,
      olderSnapshot: null,
    };
  }
  const [newer, older] = snaps;
  return {
    summary: summarizeTrendFromSnapshots(newer, older),
    newerSnapshot: snapshotToDto(newer),
    olderSnapshot: snapshotToDto(older),
  };
}

export async function loadLatestSnapshotsForRegion(
  db: PrismaClient,
  args: { regionSlug: string; propertyType: string; mode: string; windowDays: number; take: number }
) {
  return db.marketSnapshot.findMany({
    where: {
      regionSlug: args.regionSlug,
      propertyType: args.propertyType,
      mode: args.mode,
      analysisWindowDays: args.windowDays,
    },
    orderBy: { snapshotDate: "desc" },
    take: args.take,
  });
}
