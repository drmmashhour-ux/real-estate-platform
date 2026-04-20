/**
 * [action-simulation] — never throws.
 */

import type { SimulationOverall } from "@/modules/growth/action-simulation.types";

const P = "[action-simulation]";

let simCount = 0;
let compareCount = 0;
const byOverall: Record<SimulationOverall, number> = {
  favorable: 0,
  mixed: 0,
  weak: 0,
  insufficient_data: 0,
};
let lowConf = 0;

export function logSimulationBuilt(params: {
  overall: SimulationOverall;
  effects: number;
  baselineConfidence: string;
}): void {
  try {
    simCount += 1;
    byOverall[params.overall] = (byOverall[params.overall] ?? 0) + 1;
    console.info(
      `${P} built overall=${params.overall} effects=${params.effects} baseline_conf=${params.baselineConfidence} total=${simCount}`,
    );
  } catch {
    /* ignore */
  }
}

export function logSimulationLowConfidence(): void {
  try {
    lowConf += 1;
    console.info(`${P} low_output_confidence count=${lowConf}`);
  } catch {
    /* ignore */
  }
}

export function logSimulationCompare(winner: string, conf: string): void {
  try {
    compareCount += 1;
    console.info(`${P} compare winner=${winner} conf=${conf} total_comparisons=${compareCount}`);
  } catch {
    /* ignore */
  }
}

export function getActionSimulationMonitoringSnapshot() {
  return { simCount, compareCount, byOverall, lowConf };
}

export function resetActionSimulationMonitoringForTests(): void {
  simCount = 0;
  compareCount = 0;
  lowConf = 0;
  (Object.keys(byOverall) as SimulationOverall[]).forEach((k) => {
    byOverall[k] = 0;
  });
}
