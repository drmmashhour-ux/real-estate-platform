/**
 * Advisory priority annotations from memory — soft visibility hints only; no ordering override.
 */

import type { GrowthStrategyPriority } from "./growth-strategy.types";
import type { GrowthMemorySummary } from "./growth-memory.types";

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/\W+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 3),
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let n = 0;
  for (const x of a) {
    if (b.has(x)) n += 1;
  }
  return n / Math.min(a.size, b.size);
}

export type GrowthMemoryPriorityBridgeInput = {
  priorities: GrowthStrategyPriority[];
};

/**
 * Adds optional memoryAnnotations + small advisoryVisibilityBoost when titles align with memory entries.
 * Does not reorder or remove priorities.
 */
export function applyGrowthMemoryToPriorities(
  input: GrowthMemoryPriorityBridgeInput,
  memory: GrowthMemorySummary,
): { priorities: GrowthStrategyPriority[] } {
  const blockOrLesson = [
    ...memory.recurringBlockers,
    ...memory.followupLessons,
    ...memory.campaignLessons,
    ...memory.governanceLessons,
  ];
  const wins = memory.winningPatterns;

  const priorities = input.priorities.map((p) => {
    const pt = tokenize(p.title);
    const notes: string[] = [];

    for (const e of blockOrLesson) {
      const et = tokenize(e.title);
      if (overlapScore(pt, et) >= 0.15 || [...pt].some((w) => e.title.toLowerCase().includes(w))) {
        notes.push(`Memory signal: ${e.title.slice(0, 140)}`);
      }
    }
    for (const e of wins) {
      const et = tokenize(e.title);
      if (overlapScore(pt, et) >= 0.12) {
        notes.push(`Reinforce pattern: ${e.title.slice(0, 120)}`);
      }
    }

    const unique = [...new Set(notes)].slice(0, 2);
    const boost = unique.length ? Math.min(0.12, 0.035 * unique.length) : undefined;

    if (unique.length === 0 && boost == null) {
      return p;
    }

    return {
      ...p,
      memoryAnnotations: unique.length ? unique : undefined,
      memoryAdvisoryBoost: boost,
    };
  });

  return { priorities };
}
