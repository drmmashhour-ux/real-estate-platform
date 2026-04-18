/**
 * Multi-agent coordination monitoring — never throws.
 */

import { growthMultiAgentFlags } from "@/config/feature-flags";
import type { GrowthAgentProposal } from "./growth-agents.types";

export type GrowthAgentMonitoringSnapshot = {
  coordinationRuns: number;
  proposalsGenerated: number;
  conflictsDetected: number;
  alignmentsDetected: number;
  topPriorityChanges: number;
  missingAgentWarnings: number;
};

const snap: GrowthAgentMonitoringSnapshot = {
  coordinationRuns: 0,
  proposalsGenerated: 0,
  conflictsDetected: 0,
  alignmentsDetected: 0,
  topPriorityChanges: 0,
  missingAgentWarnings: 0,
};

let lastTopTitles: string[] = [];

export function getGrowthAgentMonitoringSnapshot(): GrowthAgentMonitoringSnapshot {
  return { ...snap };
}

export function resetGrowthAgentMonitoringForTests(): void {
  snap.coordinationRuns = 0;
  snap.proposalsGenerated = 0;
  snap.conflictsDetected = 0;
  snap.alignmentsDetected = 0;
  snap.topPriorityChanges = 0;
  snap.missingAgentWarnings = 0;
  lastTopTitles = [];
}

export function recordGrowthAgentCoordination(input: {
  proposalCount: number;
  conflictCount: number;
  alignmentCount: number;
  topPriorities: GrowthAgentProposal[];
  missingAgentWarnings: number;
}): void {
  if (!growthMultiAgentFlags.growthMultiAgentV1) return;
  try {
    snap.coordinationRuns += 1;
    snap.proposalsGenerated += input.proposalCount;
    snap.conflictsDetected += input.conflictCount;
    snap.alignmentsDetected += input.alignmentCount;
    snap.missingAgentWarnings += input.missingAgentWarnings;

    const titles = input.topPriorities.map((p) => p.title.slice(0, 80));
    if (lastTopTitles.length && JSON.stringify(titles) !== JSON.stringify(lastTopTitles)) {
      snap.topPriorityChanges += 1;
    }
    lastTopTitles = titles;

    console.log(
      JSON.stringify({
        tag: "[growth:agents]",
        phase: "completed",
        proposals: input.proposalCount,
        conflicts: input.conflictCount,
        alignments: input.alignmentCount,
        topTitles: titles,
        missingAgentWarnings: input.missingAgentWarnings,
      }),
    );
  } catch {
    /* never throw */
  }
}

export function logGrowthAgentCoordinationStarted(): void {
  if (!growthMultiAgentFlags.growthMultiAgentV1) return;
  try {
    console.log(JSON.stringify({ tag: "[growth:agents]", phase: "started" }));
  } catch {
    /* never throw */
  }
}
