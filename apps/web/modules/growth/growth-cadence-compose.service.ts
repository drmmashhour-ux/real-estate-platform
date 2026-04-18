/**
 * Pure cadence bundle composition — no I/O (for tests and deterministic replays).
 */

import { buildGrowthDailyCadence, type GrowthDailyCadenceInput } from "./growth-cadence-daily.service";
import { buildGrowthWeeklyCadence, type GrowthWeeklyCadenceInput } from "./growth-cadence-weekly.service";
import type { GrowthCadenceBundle } from "./growth-cadence.types";

export function composeGrowthCadenceBundle(
  dailyInput: GrowthDailyCadenceInput,
  weeklyInput: GrowthWeeklyCadenceInput,
): GrowthCadenceBundle {
  const daily = buildGrowthDailyCadence(dailyInput);
  const weekly = buildGrowthWeeklyCadence(weeklyInput);
  const createdAt = new Date().toISOString();
  return { daily, weekly, createdAt };
}
