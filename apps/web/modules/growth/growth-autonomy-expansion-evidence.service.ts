/**
 * Builds per–action-key evidence from audit aggregates + learning aggregates (bounded window).
 */

import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";
import { listCatalogIdsForLowRiskActionKey } from "./growth-autonomy-auto-allowlist";
import { computeEffectivenessForCategory } from "./growth-autonomy-effectiveness.service";
import type { GrowthAutonomyExpansionEvidence } from "./growth-autonomy-expansion.types";
import { expansionEvidenceWindowDays } from "./growth-autonomy-expansion-config";
import { aggregateExecutionStatsByActionKey } from "./growth-autonomy-expansion-evidence.repository";
import { catalogIdToLearningCategory } from "./growth-autonomy-learning-category";
import type { GrowthAutonomyCategoryAggregate } from "./growth-autonomy-learning.types";
import { getGrowthAutonomyLearningStateRow } from "./growth-autonomy-learning.repository";

function emptyAgg(): GrowthAutonomyCategoryAggregate {
  return {
    shown: 0,
    interacted: 0,
    prefillUsed: 0,
    completed: 0,
    helpfulYes: 0,
    helpfulNo: 0,
    confusion: 0,
    ignored: 0,
  };
}

function mergeCatalogAggregates(
  catalogIds: string[],
  raw: Record<string, GrowthAutonomyCategoryAggregate>,
): GrowthAutonomyCategoryAggregate {
  const out = emptyAgg();
  for (const id of catalogIds) {
    const a = raw[id] ?? emptyAgg();
    out.shown += a.shown;
    out.interacted += a.interacted;
    out.prefillUsed += a.prefillUsed;
    out.completed += a.completed;
    out.helpfulYes += a.helpfulYes;
    out.helpfulNo += a.helpfulNo;
    out.confusion += a.confusion;
    out.ignored += a.ignored;
  }
  return out;
}

export async function loadExecutionStatsMap(args: { since: Date }): Promise<Map<string, { total: number; undone: number }>> {
  const stats = await aggregateExecutionStatsByActionKey({ since: args.since });
  const m = new Map<string, { total: number; undone: number }>();
  for (const s of stats) {
    m.set(s.lowRiskActionKey, { total: s.total, undone: s.undone });
  }
  return m;
}

export async function buildEvidenceForLowRiskActionKey(args: {
  lowRiskActionKey: GrowthAutonomyLowRiskActionKey | string;
  statsByKey: Map<string, { total: number; undone: number }>;
  learningAggregates: Record<string, GrowthAutonomyCategoryAggregate>;
  observationWindowDays: number;
}): Promise<GrowthAutonomyExpansionEvidence> {
  const key = args.lowRiskActionKey;
  const catalogIds = listCatalogIdsForLowRiskActionKey(key as GrowthAutonomyLowRiskActionKey);
  const onAllowlist = catalogIds.length > 0;

  const st = args.statsByKey.get(key) ?? { total: 0, undone: 0 };
  const sampleSizeExecuted = st.total;
  const sampleSizeUndone = st.undone;
  const undoRate = sampleSizeExecuted > 0 ? sampleSizeUndone / sampleSizeExecuted : 0;

  const merged =
    catalogIds.length > 0 ?
      mergeCatalogAggregates(catalogIds, args.learningAggregates)
    : emptyAgg();

  const primaryCatalogId = catalogIds[0] ?? "cat-generic";
  const cat = catalogIdToLearningCategory(primaryCatalogId);
  const eff = computeEffectivenessForCategory({ category: cat, aggregate: merged });
  const learningSparse = eff.band === "insufficient_data";

  const fbDenom = merged.helpfulYes + merged.helpfulNo;
  const positiveFeedbackRate = fbDenom > 0 ? merged.helpfulYes / fbDenom : undefined;

  const downgradeApproxCount = merged.helpfulNo + merged.confusion;

  return {
    lowRiskActionKey: key,
    onAllowlist,
    catalogEntryIds: catalogIds,
    sampleSizeExecuted,
    sampleSizeUndone,
    undoRate,
    downgradeApproxCount,
    learningHelpfulYes: merged.helpfulYes,
    learningHelpfulNo: merged.helpfulNo,
    learningSparse,
    positiveFeedbackRate,
    auditRowsComplete: sampleSizeExecuted,
    auditRowsIncomplete: 0,
    observationWindowDays: args.observationWindowDays,
  };
}

export async function loadLearningAggregatesForExpansion(): Promise<Record<string, GrowthAutonomyCategoryAggregate>> {
  try {
    const row = await getGrowthAutonomyLearningStateRow();
    return row.aggregatesByCategory ?? {};
  } catch {
    return {};
  }
}

export function expansionObservationSince(): Date {
  const days = expansionEvidenceWindowDays();
  return new Date(Date.now() - days * 86_400_000);
}
