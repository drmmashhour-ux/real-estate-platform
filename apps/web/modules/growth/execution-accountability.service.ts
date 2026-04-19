/**
 * Bounded in-memory store for internal accountability visibility — resets on deploy.
 */

import { build14DayRoutine } from "@/modules/growth/daily-routine.service";
import { buildMontrealDominationPlan } from "@/modules/growth/montreal-domination.service";
import type {
  ExecutionAccountabilitySummary,
  ExecutionAccountabilitySurfaceBreakdown,
  ExecutionAccountabilityUserBreakdown,
  ExecutionChecklistEntry,
  ExecutionSurfaceType,
} from "@/modules/growth/execution-accountability.types";
import {
  recordAccountabilityCompletionLogged,
  recordAccountabilityLowDataTagged,
  recordAccountabilitySummaryBuilt,
} from "@/modules/growth/execution-accountability-monitoring.service";

const MAX_LOGICAL_KEYS = 8000;
const MAX_PITCH_EVENTS = 2500;

/** Logical checklist key → latest snapshot. */
const logical = new Map<string, ExecutionChecklistEntry>();
/** Append-only pitch copy / usage rows (bounded). */
const pitchEvents: ExecutionChecklistEntry[] = [];

export function countExpectedDailyRoutineSlots(): number {
  let n = 0;
  for (const d of build14DayRoutine()) {
    for (const b of d.blocks) {
      n += b.actions.length;
    }
  }
  return n;
}

export function countExpectedMontrealDominationSlots(): number {
  const plan = buildMontrealDominationPlan();
  return plan.weeks.reduce((sum, w) => sum + w.actions.length, 0);
}

function logicalKey(surface: ExecutionSurfaceType, userId: string, itemId: string): string {
  return `${surface}\u0000${userId}\u0000${itemId}`;
}

function slugId(...parts: string[]): string {
  const s = parts.join("|").replace(/[^a-z0-9|]+/gi, "-").slice(0, 96);
  return s || "id";
}

export function recordChecklistCompletion(input: {
  surfaceType: Exclude<ExecutionSurfaceType, "pitch_script">;
  itemId: string;
  userId: string;
  completed: boolean;
  dayNumber?: number;
  weekNumber?: number;
}): ExecutionChecklistEntry {
  const now = new Date().toISOString();
  const id = `acc-${slugId(input.surfaceType, input.userId, input.itemId)}`;
  const row: ExecutionChecklistEntry = {
    id,
    surfaceType: input.surfaceType,
    itemId: input.itemId,
    dayNumber: input.dayNumber,
    weekNumber: input.weekNumber,
    userId: input.userId,
    completed: input.completed,
    completedAt: input.completed ? now : undefined,
    createdAt: logical.get(logicalKey(input.surfaceType, input.userId, input.itemId))?.createdAt ?? now,
  };

  logical.set(logicalKey(input.surfaceType, input.userId, input.itemId), row);

  if (logical.size > MAX_LOGICAL_KEYS) {
    const first = logical.keys().next().value as string | undefined;
    if (first) logical.delete(first);
    void recordAccountabilityLowDataTagged("trim-oldest-logical");
  }

  void recordAccountabilityCompletionLogged({
    surfaceType: input.surfaceType,
    itemId: input.itemId,
    userId: input.userId,
    completed: input.completed,
  });

  return row;
}

/** Clears completion for a checklist cell (same as recording completed=false). */
export function clearChecklistCompletion(input: {
  surfaceType: Exclude<ExecutionSurfaceType, "pitch_script">;
  itemId: string;
  userId: string;
}): ExecutionChecklistEntry {
  return recordChecklistCompletion({
    surfaceType: input.surfaceType,
    itemId: input.itemId,
    userId: input.userId,
    completed: false,
  });
}

/** Lightweight pitch script usage — each copy adds an immutable row (bounded list). */
export function recordPitchScriptUsage(input: {
  variant: "60_sec" | "5_min";
  userId: string;
}): ExecutionChecklistEntry {
  const now = new Date().toISOString();
  const itemId = input.variant === "60_sec" ? "copy_60_sec" : "copy_5_min";
  const row: ExecutionChecklistEntry = {
    id: `acc-pitch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    surfaceType: "pitch_script",
    itemId,
    userId: input.userId,
    completed: true,
    completedAt: now,
    createdAt: now,
  };
  pitchEvents.push(row);
  while (pitchEvents.length > MAX_PITCH_EVENTS) pitchEvents.shift();
  void recordAccountabilityCompletionLogged({
    surfaceType: "pitch_script",
    itemId,
    userId: input.userId,
    completed: true,
  });
  return row;
}

export function listChecklistCompletions(filter?: {
  surfaceType?: ExecutionSurfaceType;
  userId?: string;
}): ExecutionChecklistEntry[] {
  const fromLogical = [...logical.values()];
  const fromPitch = filter?.surfaceType && filter.surfaceType !== "pitch_script" ? [] : [...pitchEvents];
  const merged = [...fromLogical, ...fromPitch];
  let out = merged;
  if (filter?.surfaceType) {
    out = out.filter((e) => e.surfaceType === filter.surfaceType);
  }
  if (filter?.userId) {
    out = out.filter((e) => e.userId === filter.userId);
  }
  return out.sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt));
}

function userIdsWithActivity(): Set<string> {
  const ids = new Set<string>();
  for (const e of logical.values()) {
    if (e.userId) ids.add(e.userId);
  }
  for (const e of pitchEvents) {
    if (e.userId) ids.add(e.userId);
  }
  return ids;
}

function completedCountForUser(
  userId: string,
  surface: Exclude<ExecutionSurfaceType, "pitch_script">,
): number {
  let n = 0;
  for (const e of logical.values()) {
    if (e.userId === userId && e.surfaceType === surface && e.completed) n += 1;
  }
  return n;
}

export function buildExecutionAccountabilitySummary(): ExecutionAccountabilitySummary {
  const generatedAt = new Date().toISOString();
  const nDaily = countExpectedDailyRoutineSlots();
  const nMtl = countExpectedMontrealDominationSlots();
  const templateTotalPerUser = nDaily + nMtl;

  const users = [...userIdsWithActivity()];
  const distinctUsers = users.length;
  const entryCount = logical.size + pitchEvents.length;

  const lowData =
    distinctUsers < 2 ||
    entryCount < 12 ||
    [...logical.values()].filter((e) => e.completed).length < 5;

  if (lowData) {
    void recordAccountabilityLowDataTagged(
      distinctUsers < 2 ? "lt-2-users" : entryCount < 12 ? "lt-12-entries" : "lt-5-completions",
    );
  }

  const byUser: ExecutionAccountabilityUserBreakdown[] = users
    .map((userId) => {
      const cDaily = completedCountForUser(userId, "daily_routine");
      const cMtl = completedCountForUser(userId, "city_domination_mtl");
      const completedItems = cDaily + cMtl;
      const skippedItems = Math.max(0, templateTotalPerUser - completedItems);
      const completionRate = templateTotalPerUser > 0 ? completedItems / templateTotalPerUser : 0;
      return {
        userId,
        totalExpected: templateTotalPerUser,
        completedItems,
        skippedItems,
        completionRate,
        onTrack: completionRate >= 0.5,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  let totalItems = 0;
  let completedItems = 0;
  let skippedItems = 0;

  if (distinctUsers === 0) {
    totalItems = 0;
    completedItems = 0;
    skippedItems = 0;
  } else {
    for (const u of byUser) {
      totalItems += u.totalExpected;
      completedItems += u.completedItems;
      skippedItems += u.skippedItems;
    }
  }

  const completionRate = totalItems > 0 ? completedItems / totalItems : 0;

  const pitchCopyCount = pitchEvents.length;

  const dailyDone = [...logical.values()].filter((e) => e.surfaceType === "daily_routine" && e.completed).length;
  const mtlDone = [...logical.values()].filter((e) => e.surfaceType === "city_domination_mtl" && e.completed).length;

  const bySurface: ExecutionAccountabilitySurfaceBreakdown[] = [
    mkSurface("daily_routine", nDaily * Math.max(1, distinctUsers), dailyDone),
    mkSurface("city_domination_mtl", nMtl * Math.max(1, distinctUsers), mtlDone),
    mkSurfacePitch(pitchCopyCount),
  ];

  void recordAccountabilitySummaryBuilt({
    totalEntries: entryCount,
    completionRate,
    lowData,
  });

  return {
    totalItems,
    completedItems,
    skippedItems,
    completionRate,
    bySurface,
    byUser,
    generatedAt,
    lowData,
  };
}

function mkSurface(
  surfaceType: Exclude<ExecutionSurfaceType, "pitch_script">,
  denom: number,
  done: number,
): ExecutionAccountabilitySurfaceBreakdown {
  const skippedItems = Math.max(0, denom - done);
  const completionRate = denom > 0 ? done / denom : 0;
  return {
    surfaceType,
    totalItems: denom,
    completedItems: done,
    skippedItems,
    completionRate,
  };
}

function mkSurfacePitch(copyCount: number): ExecutionAccountabilitySurfaceBreakdown {
  return {
    surfaceType: "pitch_script",
    totalItems: copyCount,
    completedItems: copyCount,
    skippedItems: 0,
    completionRate: copyCount > 0 ? 1 : 0,
  };
}

/** Vitest-only store reset. */
export function resetExecutionAccountabilityForTests(): void {
  logical.clear();
  pitchEvents.length = 0;
}
