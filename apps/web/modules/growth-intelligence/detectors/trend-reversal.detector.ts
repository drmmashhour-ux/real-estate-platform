import {
  GROWTH_TREND_MIN_BASELINE_COUNT,
  GROWTH_TREND_REVERSAL_RELATIVE_DROP,
} from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { explain, stableSignalId } from "./growth-detector-utils";

function positiveVolume(m: Partial<Record<string, number>>): number {
  const keys = ["action_allowed", "listing_published"] as const;
  let s = 0;
  for (const k of keys) {
    s += m[k] ?? 0;
  }
  return s;
}

/** Append-only timeline: sharp drop in positive governance/market events vs prior 30d window. */
export function detectTrendReversal(snapshot: GrowthSnapshot): GrowthSignal[] {
  const agg = snapshot.timelineAggregation;
  if (!agg) {
    return [];
  }

  const curr = positiveVolume(agg.eventCounts30d);
  const prev = positiveVolume(agg.eventCountsPrev30d);

  if (prev < GROWTH_TREND_MIN_BASELINE_COUNT) return [];

  const threshold = prev * (1 - GROWTH_TREND_REVERSAL_RELATIVE_DROP);
  if (curr >= threshold) return [];

  const dropRatio = prev > 0 ? (prev - curr) / prev : 0;

  return [
    {
      id: stableSignalId(["trend_reversal", snapshot.id, snapshot.country]),
      signalType: "trend_reversal",
      severity: dropRatio >= 0.55 ? "critical" : "warning",
      entityType: "market_timeline",
      entityId: null,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Positive event volume declined vs prior 30d",
      explanation: explain(
        "Event timeline shows fewer action_allowed/listing_published events in trailing 30d vs prior 30d — advisory review",
        {
          currPositive: curr,
          prevPositive: prev,
          baselineMin: GROWTH_TREND_MIN_BASELINE_COUNT,
        }
      ),
      observedAt: snapshot.collectedAt,
      metadata: {
        timelineDerived: true,
        worseningScore: Math.round(Math.min(100, 60 + dropRatio * 80)),
        timelinePersistenceScore: 72,
        currPositive: curr,
        prevPositive: prev,
        dropRatio,
      },
      references: [{ kind: "event", refKey: "timeline:30d_vs_prev30d", label: "append_only_timeline" }],
    },
  ];
}
