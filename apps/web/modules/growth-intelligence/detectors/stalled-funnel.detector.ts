import { GROWTH_STALLED_WORKFLOW_MIN } from "../growth.config";
import type { GrowthSignal } from "../growth.types";
import type { GrowthSnapshot } from "../growth.types";
import { explain, stableSignalId } from "./growth-detector-utils";

/** Workflows with submission/review activity but no approval within the comparison window. */
export function detectStalledFunnel(snapshot: GrowthSnapshot): GrowthSignal[] {
  const agg = snapshot.timelineAggregation;
  if (!agg) return [];

  const n = agg.stalledWorkflowCount;
  if (n < GROWTH_STALLED_WORKFLOW_MIN) return [];

  return [
    {
      id: stableSignalId(["stalled_funnel", snapshot.id]),
      signalType: "stalled_funnel",
      severity: n >= GROWTH_STALLED_WORKFLOW_MIN * 2 ? "critical" : "warning",
      entityType: "workflow_segment",
      entityId: null,
      region: null,
      locale: snapshot.locale,
      country: snapshot.country,
      title: "Stalled compliance workflows detected",
      explanation: explain(
        "Workflow entities show submission/review activity without approval in the timeline window — funnel completion gap",
        { stalledWorkflowCount: n, minForSignal: GROWTH_STALLED_WORKFLOW_MIN }
      ),
      observedAt: snapshot.collectedAt,
      metadata: {
        timelineDerived: true,
        stalledWorkflowCount: n,
        worseningScore: 42,
        timelinePersistenceScore: 76,
      },
      references: [{ kind: "event", refKey: "workflow_stall_heuristic", label: "append_only_timeline" }],
    },
  ];
}
