import type { ScriptConversionStats } from "@/modules/sales-scripts/sales-script.types";

import type { CallPerformanceVm, TrainingGamificationVm, TrainingLevel } from "./call-center.types";

export function buildCallPerformanceVm(stats: ScriptConversionStats, sinceDays: number): CallPerformanceVm {
  let callsLogged = 0;
  let demosBooked = 0;

  for (const v of Object.values(stats.byCategory)) {
    callsLogged += v.total;
    demosBooked += v.byOutcome.DEMO ?? 0;
  }

  const conversionRate = callsLogged > 0 ? demosBooked / callsLogged : 0;

  return {
    callsLogged,
    demosBooked,
    conversionRate: Math.round(conversionRate * 1000) / 1000,
    topObjections: stats.topObjections.slice(0, 8),
    sinceDays,
  };
}

const LEVEL_ORDER: TrainingLevel[] = ["beginner", "intermediate", "advanced", "elite"];

export function levelFromAverageScore(avg: number): TrainingLevel {
  if (avg >= 88) return "elite";
  if (avg >= 75) return "advanced";
  if (avg >= 60) return "intermediate";
  return "beginner";
}

export function xpTowardNextLevel(avg: number): number {
  const idx = LEVEL_ORDER.indexOf(levelFromAverageScore(avg));
  const targets = [60, 75, 88, 100];
  const nextTarget = targets[idx + 1] ?? 100;
  return Math.max(0, nextTarget - Math.round(avg));
}

export function buildGamificationVm(recentScores: number[], streak: number): TrainingGamificationVm {
  const avg =
    recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;
  const level = levelFromAverageScore(avg);
  return {
    averageScore: Math.round(avg * 10) / 10,
    streak,
    level,
    xpTowardNext: xpTowardNextLevel(avg),
  };
}
