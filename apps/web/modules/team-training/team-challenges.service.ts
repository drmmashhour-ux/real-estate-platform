import { TRAINING_SCENARIOS } from "@/modules/training-scenarios/training-scenarios.data";

import type { ChallengeProgress, TeamChallenge } from "./team.types";
import { notifyTeam } from "./team-notifications.service";
import { loadStore, saveStore } from "./team-storage";

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Seed challenges for current day/week if missing */
export function ensureChallenges(teamId: string): TeamChallenge[] {
  const store = loadStore();
  const dailyId = `daily-${dayKey()}`;
  const weeklyId = `weekly-${weekKey()}`;
  let seeded = false;

  if (!store.challenges[dailyId]) {
    const extremeBroker = TRAINING_SCENARIOS.find((s) => s.id === "broker-aggressive-extreme");
    store.challenges[dailyId] = {
      challengeId: dailyId,
      cadence: "daily",
      title: "Close 2 extreme-pressure replies",
      description: extremeBroker
        ? "Win the aggressive broker extreme scenario twice with passing scores."
        : "Complete two HARD broker scenarios with wins.",
      targetScenarioId: extremeBroker?.id,
      targetCount: 2,
      startsAtIso: new Date().toISOString(),
      endsAtIso: new Date(Date.now() + 86400000).toISOString(),
    };
    seeded = true;
  }

  if (!store.challenges[weeklyId]) {
    store.challenges[weeklyId] = {
      challengeId: weeklyId,
      cadence: "weekly",
      title: "Weekly — 5 scenario wins",
      description: "Log five winning training sessions (solo or team).",
      targetCount: 5,
      startsAtIso: new Date().toISOString(),
      endsAtIso: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
    seeded = true;
  }

  saveStore(store);

  if (seeded && teamId) {
    notifyTeam(teamId, {
      kind: "challenge",
      title: "New team challenges",
      body: "Daily and weekly objectives are ready for your reps.",
    });
  }

  return [store.challenges[dailyId]!, store.challenges[weeklyId]!].filter(Boolean);
}

export function listActiveChallenges(): TeamChallenge[] {
  return Object.values(loadStore().challenges).sort((a, b) => b.startsAtIso.localeCompare(a.startsAtIso));
}

export function bumpChallengeProgress(memberId: string, scenarioId: string | undefined, won: boolean): void {
  if (!won) return;
  const store = loadStore();
  const dailyId = `daily-${dayKey()}`;
  const weeklyId = `weekly-${weekKey()}`;

  const bump = (challengeId: string, increment: number) => {
    const ch = store.challenges[challengeId];
    if (!ch) return;
    const key = `${challengeId}:${memberId}`;
    const row =
      store.challengeProgress[key] ??
      ({
        challengeId,
        memberId,
        currentCount: 0,
      } satisfies ChallengeProgress);
    row.currentCount += increment;
    if (row.currentCount >= ch.targetCount && !row.completedAtIso) {
      row.completedAtIso = new Date().toISOString();
    }
    store.challengeProgress[key] = row;
  };

  const daily = store.challenges[dailyId];
  if (daily?.targetScenarioId) {
    if (scenarioId === daily.targetScenarioId) bump(dailyId, 1);
  } else if (daily) {
    bump(dailyId, 1);
  }

  if (store.challenges[weeklyId]) bump(weeklyId, 1);

  saveStore(store);
}

export function getChallengeProgress(challengeId: string, memberId: string): ChallengeProgress | undefined {
  return loadStore().challengeProgress[`${challengeId}:${memberId}`];
}
