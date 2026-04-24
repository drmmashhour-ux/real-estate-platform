import type { PlaybookScoreBand } from "@prisma/client";
import { playbookLog } from "../playbook-memory.logger";
import * as repo from "../repository/playbook-memory.repository";
import { buildLearnAggregateFromRecords, type PlaybookLearnAggregateStats } from "../utils/playbook-memory-aggregate";
import { incrementEmptyPlaybooks, incrementFailures, incrementRecalculations } from "./playbook-memory-monitoring.service";

const PB = "[playbook]";

export type RecalculatePlaybookResult =
  | { ok: true; playbookId: string; empty: boolean; stats: PlaybookLearnAggregateStats }
  | { ok: false; playbookId: string; error: string };

export type RecalculateVersionResult =
  | { ok: true; playbookVersionId: string; empty: boolean; stats: VersionLearnStats }
  | { ok: false; playbookVersionId: string; error: string };

export type VersionLearnStats = {
  executions: number;
  successes: number;
  failures: number;
  avgRealizedValue: number | null;
  avgRevenueLift: number | null;
  avgConversionLift: number | null;
  avgRiskScore: number | null;
};

export type RecalculateAllResult = {
  ok: true;
  processed: number;
  failed: number;
  empty: number;
  playbookIds: string[];
};

/**
 * Recompute `MemoryPlaybook` aggregates from linked `PlaybookMemoryRecord` rows. Never throws.
 */
export async function recalculatePlaybookStats(playbookId: string): Promise<RecalculatePlaybookResult> {
  try {
    const memories = await repo.memoriesForPlaybookAggregate(playbookId);
    const empty = memories.length === 0;
    if (empty) {
      incrementEmptyPlaybooks();
    }

    const stats = buildLearnAggregateFromRecords(memories);
    await repo.updateMemoryPlaybook(playbookId, {
      totalExecutions: stats.totalExecutions,
      successfulExecutions: stats.successfulExecutions,
      failedExecutions: stats.failedExecutions,
      avgExpectedValue: stats.avgExpectedValue,
      avgRealizedValue: stats.avgRealizedValue,
      avgRealizedRevenue: stats.avgRealizedRevenue,
      avgConversionLift: stats.avgConversionLift,
      avgRiskScore: stats.avgRiskScore,
      scoreBand: stats.scoreBand,
      lastExecutedAt: stats.lastActivityAt ?? undefined,
    });

    incrementRecalculations();
    playbookLog.info("recalculatePlaybookStats", { playbookId, empty, scoreBand: stats.scoreBand });
    // eslint-disable-next-line no-console
    console.log(PB, "learning_playbook_recalculated", { playbookId, empty, scoreBand: stats.scoreBand });
    return { ok: true, playbookId, empty, stats };
  } catch (e) {
    incrementFailures();
    const error = e instanceof Error ? e.message : String(e);
    playbookLog.error("recalculatePlaybookStats failed", { playbookId, error });
    // eslint-disable-next-line no-console
    console.error(PB, "learning_playbook_recalculate_failed", { playbookId, error });
    return { ok: false, playbookId, error };
  }
}

/**
 * Recompute `MemoryPlaybookVersion` execution counters and metric averages. Never throws.
 */
export async function recalculateVersionStats(playbookVersionId: string): Promise<RecalculateVersionResult> {
  try {
    const memories = await repo.memoriesForVersionAggregate(playbookVersionId);
    const empty = memories.length === 0;
    if (empty) {
      incrementEmptyPlaybooks();
    }

    const successes = memories.filter((m) => m.outcomeStatus === "SUCCEEDED").length;
    const failures = memories.filter((m) => m.outcomeStatus === "FAILED").length;
    const executions = memories.length;

    const avgRealizedValue = nullIfNone(memories.map((m) => m.realizedValue));
    const avgRevenueLift = nullIfNone(memories.map((m) => m.realizedRevenue));
    const avgConversionLift = nullIfNone(memories.map((m) => m.realizedConversion));
    const avgRiskScore = nullIfNone(memories.map((m) => m.realizedRiskScore));

    const stats: VersionLearnStats = {
      executions,
      successes,
      failures,
      avgRealizedValue,
      avgRevenueLift,
      avgConversionLift,
      avgRiskScore,
    };

    await repo.updateMemoryPlaybookVersion(playbookVersionId, {
      executions: stats.executions,
      successes: stats.successes,
      failures: stats.failures,
      avgRealizedValue: stats.avgRealizedValue ?? undefined,
      avgRevenueLift: stats.avgRevenueLift ?? undefined,
      avgConversionLift: stats.avgConversionLift ?? undefined,
      avgRiskScore: stats.avgRiskScore ?? undefined,
    });

    incrementRecalculations();
    playbookLog.info("recalculateVersionStats", { playbookVersionId, empty, executions: stats.executions });
    // eslint-disable-next-line no-console
    console.log(PB, "learning_version_recalculated", { playbookVersionId, empty, executions: stats.executions });
    return { ok: true, playbookVersionId, empty, stats };
  } catch (e) {
    incrementFailures();
    const error = e instanceof Error ? e.message : String(e);
    playbookLog.error("recalculateVersionStats failed", { playbookVersionId, error });
    // eslint-disable-next-line no-console
    console.error(PB, "learning_version_recalculate_failed", { playbookVersionId, error });
    return { ok: false, playbookVersionId, error };
  }
}

function nullIfNone(values: (number | null | undefined)[]): number | null {
  const n = values.filter((v): v is number => v != null && Number.isFinite(v));
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}

/**
 * Recompute all memory playbooks (bounded by repo list). Never throws; returns a summary.
 */
export async function recalculateAllPlaybookStats(): Promise<RecalculateAllResult> {
  const playbookIds = await repo.listAllMemoryPlaybookIds();
  let failed = 0;
  let empty = 0;
  for (const id of playbookIds) {
    const r = await recalculatePlaybookStats(id);
    if (!r.ok) {
      failed += 1;
    } else if (r.empty) {
      empty += 1;
    }
  }
  playbookLog.info("recalculateAllPlaybookStats", { processed: playbookIds.length, failed, empty });
  // eslint-disable-next-line no-console
  console.log(PB, "learning_all_recalculated", { processed: playbookIds.length, failed, empty });
  return { ok: true, processed: playbookIds.length, failed, empty, playbookIds };
}

export async function learnFromMemoryRecord(memoryRecordId: string): Promise<void> {
  try {
    const rec = await repo.findMemoryRecordById(memoryRecordId);
    if (!rec) return;
    if (rec.memoryPlaybookId) {
      await recalculatePlaybookStats(rec.memoryPlaybookId);
    }
    if (rec.memoryPlaybookVersionId) {
      await recalculateVersionStats(rec.memoryPlaybookVersionId);
    }
  } catch (e) {
    playbookLog.warn("learnFromMemoryRecord deferred", { memoryRecordId, message: e instanceof Error ? e.message : String(e) });
  }
}
