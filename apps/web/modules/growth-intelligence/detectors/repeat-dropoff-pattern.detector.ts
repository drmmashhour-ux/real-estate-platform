import { GROWTH_REPEAT_DROPOFF_MIN_REJECTIONS } from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { explain, stableSignalId } from "./growth-detector-utils";

/** Same document entity sees repeated rejection outcomes in the trailing window. */
export function detectRepeatDropoffPattern(snapshot: GrowthSnapshot): GrowthSignal[] {
  const agg = snapshot.timelineAggregation;
  if (!agg) return [];

  let topId = "";
  let topCount = 0;
  for (const [entityId, c] of Object.entries(agg.documentRejectCounts30d)) {
    if (c >= GROWTH_REPEAT_DROPOFF_MIN_REJECTIONS && c > topCount) {
      topCount = c;
      topId = entityId;
    }
  }

  if (!topId || topCount < GROWTH_REPEAT_DROPOFF_MIN_REJECTIONS) return [];

  return [
    {
      id: stableSignalId(["repeat_dropoff", topId, snapshot.id]),
      signalType: "repeat_dropoff_pattern",
      severity: topCount >= GROWTH_REPEAT_DROPOFF_MIN_REJECTIONS + 1 ? "critical" : "warning",
      entityType: "document",
      entityId: topId,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Repeated document rejection pattern",
      explanation: explain(
        "Append-only timeline shows multiple document_rejected events for one document entity — review intake/resubmission guidance",
        {
          rejections30d: topCount,
          minForSignal: GROWTH_REPEAT_DROPOFF_MIN_REJECTIONS,
        }
      ),
      observedAt: snapshot.collectedAt,
      metadata: {
        timelineDerived: true,
        documentEntityId: topId,
        rejections30d: topCount,
        worseningScore: 58,
        timelinePersistenceScore: 80,
      },
      references: [
        { kind: "event", refKey: `document:${topId}`, label: "document_rejected_sequence" },
      ],
    },
  ];
}
