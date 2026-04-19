/**
 * Deterministic, conservative insight lines — no ML, no external calls.
 */

import { build14DayRoutine } from "@/modules/growth/daily-routine.service";
import { buildMontrealDominationPlan } from "@/modules/growth/montreal-domination.service";
import {
  listChecklistCompletions,
  countExpectedDailyRoutineSlots,
  countExpectedMontrealDominationSlots,
} from "@/modules/growth/execution-accountability.service";
import type {
  ExecutionAccountabilityInsight,
  ExecutionAccountabilitySummary,
  ExecutionChecklistEntry,
} from "@/modules/growth/execution-accountability.types";
import { recordAccountabilityInsightsBuilt } from "@/modules/growth/execution-accountability-monitoring.service";

/** Days 1–5 vs 6–14 split (“after day 5”). */
const DAY_SPLIT = 6;

function parseDailyDay(itemId: string): number | null {
  const m = /^d(\d+)-b\d+-a\d+$/.exec(itemId);
  if (!m) return null;
  return Number(m[1]);
}

function parseMtlWeek(itemId: string): number | null {
  const m = /^w(\d+)-a\d+$/.exec(itemId);
  if (!m) return null;
  return Number(m[1]);
}

export function buildExecutionAccountabilityInsights(summary: ExecutionAccountabilitySummary): ExecutionAccountabilityInsight[] {
  const insights: ExecutionAccountabilityInsight[] = [];
  const entries = listChecklistCompletions();

  if (summary.lowData) {
    insights.push({
      type: "low_data",
      label: "Insufficient data for team comparison",
      description:
        "Few operators have recorded completions yet, or totals are below the conservative threshold — treat rates as directional only.",
      severity: "info",
      suggestedAction: "Enable shared accountability on execution panels and normalize weekly review of checklists.",
    });
  }

  const dayBuckets = analyzeDailyBuckets(entries);
  if (
    dayBuckets.latePossible > 0 &&
    dayBuckets.earlyPossible > 0 &&
    dayBuckets.afterDay5Rate < dayBuckets.beforeDay6Rate - 0.15 &&
    dayBuckets.earlyDone + dayBuckets.lateDone >= 8
  ) {
    insights.push({
      type: "daily_slip_after_day5",
      label: "Daily routine completion weakens after day 5",
      description:
        "Recorded completions after day 5 trail earlier days by more than 15 points — execution discipline may be slipping mid-program.",
      severity: "warning",
      suggestedAction: "Review blockers after day 5 in operating review; shorten evening blocks if overload is consistent.",
    });
  }

  const week2Gap = montrealWeek2Incomplete(entries);
  if (week2Gap.incomplete && week2Gap.users >= 1) {
    insights.push({
      type: "mtl_week2_gap",
      label: "Montréal domination plan — week 2 incomplete",
      description:
        "At least one tracked operator has week-2 checklist items still open while later weeks show activity, or week-2 density is below 40%.",
      severity: "attention",
      suggestedAction: "Align city field work for week 2 actions before advancing narrative to week 3+ milestones.",
    });
  }

  if (pitchWithoutDailyFollowThrough(entries)) {
    insights.push({
      type: "pitch_no_followthrough",
      label: "Pitch scripts copied — little daily routine logged",
      description:
        "Pitch script copy events exist but daily routine completions for the same operators are sparse — prep is not paired with execution logging.",
      severity: "warning",
      suggestedAction: "Pair script practice with daily routine checkpoints in the same session and log completions.",
    });
  }

  if (summary.completionRate > 0 && summary.completionRate < 0.35 && !summary.lowData) {
    insights.push({
      type: "low_checklist_rate",
      label: "Overall checklist completion is below 35%",
      description:
        "Aggregate completion across daily + Montréal templates is low relative to expected slots for active users.",
      severity: "warning",
      suggestedAction: "Inspect governance load and reduce parallel experiments until baseline rhythm stabilizes.",
    });
  }

  void recordAccountabilityInsightsBuilt(insights.length);
  return insights;
}

function analyzeDailyBuckets(entries: ExecutionChecklistEntry[]): {
  beforeDay6Rate: number;
  afterDay5Rate: number;
  earlyDone: number;
  lateDone: number;
  earlyPossible: number;
  latePossible: number;
} {
  let earlyDone = 0;
  let lateDone = 0;
  const users = new Set<string>();
  for (const e of entries) {
    if (e.surfaceType !== "daily_routine") continue;
    if (e.userId) users.add(e.userId);
    if (!e.completed) continue;
    const day = parseDailyDay(e.itemId);
    if (day == null) continue;
    if (day < DAY_SPLIT) earlyDone += 1;
    else lateDone += 1;
  }
  const u = Math.max(1, users.size);
  const earlyPossible = routineSlotsThroughDay(DAY_SPLIT - 1);
  const latePossible = routineSlotsFromDay(DAY_SPLIT);
  const denomEarly = earlyPossible * u;
  const denomLate = latePossible * u;
  const beforeDay6Rate = denomEarly > 0 ? Math.min(1, earlyDone / denomEarly) : 1;
  const afterDay5Rate = denomLate > 0 ? Math.min(1, lateDone / denomLate) : 1;
  return {
    beforeDay6Rate,
    afterDay5Rate,
    earlyDone,
    lateDone,
    earlyPossible,
    latePossible,
  };
}

function routineSlotsThroughDay(lastDayInclusive: number): number {
  let n = 0;
  for (const d of build14DayRoutine()) {
    if (d.day > lastDayInclusive) break;
    for (const b of d.blocks) n += b.actions.length;
  }
  return Math.max(1, n);
}

function routineSlotsFromDay(firstDay: number): number {
  let n = 0;
  for (const d of build14DayRoutine()) {
    if (d.day < firstDay) continue;
    for (const b of d.blocks) n += b.actions.length;
  }
  return Math.max(1, n);
}

function montrealWeek2Incomplete(entries: ExecutionChecklistEntry[]): {
  incomplete: boolean;
  users: number;
} {
  const plan = buildMontrealDominationPlan();
  const w2 = plan.weeks.find((w) => w.week === 2);
  if (!w2) return { incomplete: false, users: 0 };
  const expectedW2 = w2.actions.length;
  const byUser = new Map<string, { done: number }>();
  for (const e of entries) {
    if (e.surfaceType !== "city_domination_mtl" || !e.completed) continue;
    const w = parseMtlWeek(e.itemId);
    if (w !== 2) continue;
    const uid = e.userId ?? "unknown";
    const cur = byUser.get(uid) ?? { done: 0 };
    cur.done += 1;
    byUser.set(uid, cur);
  }
  let users = 0;
  for (const [, v] of byUser) {
    if (v.done > 0 && v.done / expectedW2 < 0.4) users += 1;
  }
  return { incomplete: users > 0, users };
}

function pitchWithoutDailyFollowThrough(entries: ExecutionChecklistEntry[]): boolean {
  const pitchUsers = new Set<string>();
  const dailyByUser = new Map<string, number>();
  for (const e of entries) {
    if (e.surfaceType === "pitch_script") {
      if (e.userId) pitchUsers.add(e.userId);
    }
    if (e.surfaceType === "daily_routine" && e.completed && e.userId) {
      dailyByUser.set(e.userId, (dailyByUser.get(e.userId) ?? 0) + 1);
    }
  }
  for (const uid of pitchUsers) {
    if ((dailyByUser.get(uid) ?? 0) < 3) return true;
  }
  return false;
}

/** Expose template sizes for tests. */
export function accountabilityTemplateTotals(): { dailySlots: number; mtlSlots: number } {
  return {
    dailySlots: countExpectedDailyRoutineSlots(),
    mtlSlots: countExpectedMontrealDominationSlots(),
  };
}
