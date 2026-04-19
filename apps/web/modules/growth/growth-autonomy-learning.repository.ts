/**
 * Persistence for autonomy learning — append records + singleton state row.
 */

import { prisma } from "@/lib/db";
import { recordLearningManualReset } from "./growth-autonomy-learning-monitoring.service";
import type { GrowthAutonomyCategoryAggregate, GrowthAutonomyLearningControlFlags } from "./growth-autonomy-learning.types";

const SINGLETON_ID = "singleton";

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

function parseAgg(raw: unknown): GrowthAutonomyCategoryAggregate {
  if (!raw || typeof raw !== "object") return emptyAgg();
  const o = raw as Record<string, unknown>;
  return {
    shown: Number(o.shown) || 0,
    interacted: Number(o.interacted) || 0,
    prefillUsed: Number(o.prefillUsed) || 0,
    completed: Number(o.completed) || 0,
    helpfulYes: Number(o.helpfulYes) || 0,
    helpfulNo: Number(o.helpfulNo) || 0,
    confusion: Number(o.confusion) || 0,
    ignored: Number(o.ignored) || 0,
  };
}

export async function getGrowthAutonomyLearningStateRow(): Promise<{
  weightDeltasByCategory: Record<string, number>;
  suppressedUntilByCategory: Record<string, number>;
  aggregatesByCategory: Record<string, GrowthAutonomyCategoryAggregate>;
  controlFlags: GrowthAutonomyLearningControlFlags;
  lastLearningRunAt: Date | null;
}> {
  try {
    const row = await prisma.growthAutonomyLearningState.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!row) {
      return {
        weightDeltasByCategory: {},
        suppressedUntilByCategory: {},
        aggregatesByCategory: {},
        controlFlags: { frozen: false },
        lastLearningRunAt: null,
      };
    }
    const weights = (row.weightDeltasByCategory as Record<string, number>) ?? {};
    const sup = (row.suppressedUntilByCategory as Record<string, number>) ?? {};
    const aggRaw = (row.aggregatesByCategory as Record<string, unknown>) ?? {};
    const aggregatesByCategory: Record<string, GrowthAutonomyCategoryAggregate> = {};
    for (const [k, v] of Object.entries(aggRaw)) {
      aggregatesByCategory[k] = parseAgg(v);
    }
    const cf = (row.controlFlags as GrowthAutonomyLearningControlFlags) ?? { frozen: false };
    return {
      weightDeltasByCategory: weights,
      suppressedUntilByCategory: sup,
      aggregatesByCategory,
      controlFlags: { frozen: !!cf.frozen, lastManualResetAt: cf.lastManualResetAt, lastFreezeAt: cf.lastFreezeAt },
      lastLearningRunAt: row.lastLearningRunAt,
    };
  } catch {
    return {
      weightDeltasByCategory: {},
      suppressedUntilByCategory: {},
      aggregatesByCategory: {},
      controlFlags: { frozen: false },
      lastLearningRunAt: null,
    };
  }
}

export async function upsertGrowthAutonomyLearningState(payload: {
  weightDeltasByCategory: Record<string, number>;
  suppressedUntilByCategory: Record<string, number>;
  aggregatesByCategory: Record<string, GrowthAutonomyCategoryAggregate>;
  controlFlags: GrowthAutonomyLearningControlFlags;
  lastLearningRunAt?: Date | null;
}): Promise<void> {
  try {
    await prisma.growthAutonomyLearningState.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        weightDeltasByCategory: payload.weightDeltasByCategory,
        suppressedUntilByCategory: payload.suppressedUntilByCategory,
        aggregatesByCategory: payload.aggregatesByCategory,
        controlFlags: payload.controlFlags,
        lastLearningRunAt: payload.lastLearningRunAt ?? null,
      },
      update: {
        weightDeltasByCategory: payload.weightDeltasByCategory,
        suppressedUntilByCategory: payload.suppressedUntilByCategory,
        aggregatesByCategory: payload.aggregatesByCategory,
        controlFlags: payload.controlFlags,
        lastLearningRunAt: payload.lastLearningRunAt ?? undefined,
      },
    });
  } catch {
    /* noop — never throw from learning persistence */
  }
}

export async function appendGrowthAutonomyLearningRecord(args: {
  suggestionId: string;
  categoryId: string;
  targetKey: string;
  operatorUserId: string | null;
  interactionKind: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.growthAutonomyLearningRecord.create({
      data: {
        suggestionId: args.suggestionId,
        categoryId: args.categoryId,
        targetKey: args.targetKey,
        operatorUserId: args.operatorUserId,
        interactionKind: args.interactionKind,
        payload: args.payload,
      },
    });
  } catch {
    /* noop */
  }
}

/** Merge increment into aggregates for categoryId and persist. */
export async function bumpCategoryAggregate(
  categoryId: string,
  bump: Partial<GrowthAutonomyCategoryAggregate>,
): Promise<void> {
  try {
    const cur = await getGrowthAutonomyLearningStateRow();
    const prev = cur.aggregatesByCategory[categoryId] ?? emptyAgg();
    const next: GrowthAutonomyCategoryAggregate = {
      shown: prev.shown + (bump.shown ?? 0),
      interacted: prev.interacted + (bump.interacted ?? 0),
      prefillUsed: prev.prefillUsed + (bump.prefillUsed ?? 0),
      completed: prev.completed + (bump.completed ?? 0),
      helpfulYes: prev.helpfulYes + (bump.helpfulYes ?? 0),
      helpfulNo: prev.helpfulNo + (bump.helpfulNo ?? 0),
      confusion: prev.confusion + (bump.confusion ?? 0),
      ignored: prev.ignored + (bump.ignored ?? 0),
    };
    cur.aggregatesByCategory[categoryId] = next;
    await upsertGrowthAutonomyLearningState({
      weightDeltasByCategory: cur.weightDeltasByCategory,
      suppressedUntilByCategory: cur.suppressedUntilByCategory,
      aggregatesByCategory: cur.aggregatesByCategory,
      controlFlags: cur.controlFlags,
      lastLearningRunAt: cur.lastLearningRunAt,
    });
  } catch {
    /* noop */
  }
}

export async function resetGrowthAutonomyLearningWeights(): Promise<void> {
  try {
    await upsertGrowthAutonomyLearningState({
      weightDeltasByCategory: {},
      suppressedUntilByCategory: {},
      aggregatesByCategory: (await getGrowthAutonomyLearningStateRow()).aggregatesByCategory,
      controlFlags: {
        frozen: false,
        lastManualResetAt: new Date().toISOString(),
      },
      lastLearningRunAt: null,
    });
    recordLearningManualReset();
  } catch {
    /* noop */
  }
}

export async function setGrowthAutonomyLearningFrozen(frozen: boolean): Promise<void> {
  try {
    const cur = await getGrowthAutonomyLearningStateRow();
    await upsertGrowthAutonomyLearningState({
      weightDeltasByCategory: cur.weightDeltasByCategory,
      suppressedUntilByCategory: cur.suppressedUntilByCategory,
      aggregatesByCategory: cur.aggregatesByCategory,
      controlFlags: {
        ...cur.controlFlags,
        frozen,
        lastFreezeAt: frozen ? new Date().toISOString() : cur.controlFlags.lastFreezeAt,
      },
      lastLearningRunAt: cur.lastLearningRunAt,
    });
  } catch {
    /* noop */
  }
}
