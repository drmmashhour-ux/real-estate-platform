/**
 * Compact memory cues for Mission Control notes — reuses brief patterns; advisory only.
 */

import type { GrowthMemorySummary } from "./growth-memory.types";

/**
 * Short lines for Mission Control `notes` (append to existing MC notes; cap at caller).
 */
export function buildGrowthMemoryMissionNotes(memory: GrowthMemorySummary): string[] {
  const out: string[] = [];

  const b = memory.recurringBlockers[0];
  if (b) {
    out.push(`Memory — top recurring blocker: ${b.title}`);
  }

  const w = memory.winningPatterns[0];
  if (w) {
    out.push(`Memory — winning pattern: ${w.title}`);
  }

  const caution =
    memory.governanceLessons[0] ?? memory.campaignLessons.find((e) => e.confidence >= 0.45);
  if (caution) {
    out.push(`Memory — caution / lesson: ${caution.title}`);
  }

  return out.slice(0, 4);
}
