import type { PlaybookMemoryRecord, PlaybookScoreBand } from "@prisma/client";
import { aggregateNumericScore, numericScoreToBand } from "./playbook-memory-score";

/** Minimal record shape for pure aggregates (keeps this module testable without Prisma). */
export type PlaybookMemoryRecordForAggregate = Pick<
  PlaybookMemoryRecord,
  | "outcomeStatus"
  | "expectedValue"
  | "realizedValue"
  | "realizedRevenue"
  | "realizedConversion"
  | "realizedRiskScore"
  | "createdAt"
>;

export function countTotalExecutions(records: PlaybookMemoryRecordForAggregate[]): number {
  return records.length;
}

export function countSuccessfulExecutions(records: PlaybookMemoryRecordForAggregate[]): number {
  return records.filter((r) => r.outcomeStatus === "SUCCEEDED").length;
}

export function countFailedExecutions(records: PlaybookMemoryRecordForAggregate[]): number {
  return records.filter((r) => r.outcomeStatus === "FAILED").length;
}

function nonNullValues(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => v != null && Number.isFinite(v));
}

function averageOrNull(values: (number | null | undefined)[]): number | null {
  const n = nonNullValues(values);
  return n.length === 0 ? null : n.reduce((a, b) => a + b, 0) / n.length;
}

export function computeAverageExpectedValue(records: PlaybookMemoryRecordForAggregate[]): number | null {
  return averageOrNull(records.map((r) => r.expectedValue));
}

export function computeAverageRealizedValue(records: PlaybookMemoryRecordForAggregate[]): number | null {
  return averageOrNull(records.map((r) => r.realizedValue));
}

export function computeAverageRealizedRevenue(records: PlaybookMemoryRecordForAggregate[]): number | null {
  return averageOrNull(records.map((r) => r.realizedRevenue));
}

export function computeAverageConversionLift(records: PlaybookMemoryRecordForAggregate[]): number | null {
  return averageOrNull(records.map((r) => r.realizedConversion));
}

export function computeAverageRiskScore(records: PlaybookMemoryRecordForAggregate[]): number | null {
  return averageOrNull(records.map((r) => r.realizedRiskScore));
}

export type PlaybookLearnAggregateStats = {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExpectedValue: number | null;
  avgRealizedValue: number | null;
  avgRealizedRevenue: number | null;
  avgConversionLift: number | null;
  avgRiskScore: number | null;
  scoreBand: PlaybookScoreBand;
  lastActivityAt: Date | null;
};

/**
 * One place for: counts, nullable averages, numeric score → band, last activity.
 */
export function buildLearnAggregateFromRecords(
  records: PlaybookMemoryRecordForAggregate[],
): PlaybookLearnAggregateStats {
  const totalExecutions = countTotalExecutions(records);
  const successfulExecutions = countSuccessfulExecutions(records);
  const failedExecutions = countFailedExecutions(records);
  const avgExpectedValue = computeAverageExpectedValue(records);
  const avgRealizedValue = computeAverageRealizedValue(records);
  const avgRealizedRevenue = computeAverageRealizedRevenue(records);
  const avgConversionLift = computeAverageConversionLift(records);
  const avgRiskScore = computeAverageRiskScore(records);

  const numeric = aggregateNumericScore({
    avgConversionLift,
    avgRealizedRevenue,
    avgRealizedValue,
    avgRiskScore,
    totalExecutions,
    successfulExecutions,
  });
  const scoreBand = numericScoreToBand(numeric);
  const lastActivityAt = records[0]?.createdAt ?? null;

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    avgExpectedValue,
    avgRealizedValue,
    avgRealizedRevenue,
    avgConversionLift,
    avgRiskScore,
    scoreBand,
    lastActivityAt,
  };
}

/**
 * @deprecated use `buildLearnAggregateFromRecords` result `.scoreBand`
 * Exposed for direct tests of threshold wiring.
 */
export function computeScoreBandFromLearnStats(
  stats: Pick<
    PlaybookLearnAggregateStats,
    | "totalExecutions"
    | "successfulExecutions"
    | "avgConversionLift"
    | "avgRealizedRevenue"
    | "avgRealizedValue"
    | "avgRiskScore"
  >,
): PlaybookScoreBand {
  const n = aggregateNumericScore({
    avgConversionLift: stats.avgConversionLift,
    avgRealizedRevenue: stats.avgRealizedRevenue,
    avgRealizedValue: stats.avgRealizedValue,
    avgRiskScore: stats.avgRiskScore,
    totalExecutions: stats.totalExecutions,
    successfulExecutions: stats.successfulExecutions,
  });
  return numericScoreToBand(n);
}

/** Alias matching spec name `computeScoreBand(stats)` where `stats` is the learn bundle. */
export function computeScoreBand(stats: PlaybookLearnAggregateStats): PlaybookScoreBand {
  return computeScoreBandFromLearnStats(stats);
}
