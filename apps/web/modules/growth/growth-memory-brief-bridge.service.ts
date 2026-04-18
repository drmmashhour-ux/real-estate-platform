/**
 * One-line memory cues for daily brief / executive notes — advisory only.
 */

import type { GrowthMemorySummary } from "./growth-memory.types";

export function buildGrowthMemoryBriefNotes(memory: GrowthMemorySummary): string[] {
  const out: string[] = [];

  for (const e of memory.recurringBlockers.slice(0, 2)) {
    out.push(`Recurring blocker (memory): ${e.title}`);
  }
  for (const e of memory.winningPatterns.slice(0, 1)) {
    out.push(`Winning pattern (memory): ${e.title}`);
  }
  for (const e of memory.campaignLessons.slice(0, 2)) {
    out.push(`Lesson retained (memory): ${e.title}`);
  }
  for (const e of memory.governanceLessons.slice(0, 1)) {
    out.push(`Governance lesson (memory): ${e.title}`);
  }
  for (const e of memory.followupLessons.slice(0, 1)) {
    out.push(`Follow-up lesson (memory): ${e.title}`);
  }

  return out.slice(0, 6);
}
