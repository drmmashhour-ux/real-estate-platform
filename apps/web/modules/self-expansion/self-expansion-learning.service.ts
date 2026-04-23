import { prisma } from "@/lib/db";
import type { ExpansionLearningWeights } from "@/modules/self-expansion/self-expansion.types";

const KEY = "global";

function emptyWeights(): ExpansionLearningWeights {
  return { hubLift: {}, blockerPenalty: {}, archetypeLift: {} };
}

export async function loadLearningWeights(): Promise<ExpansionLearningWeights> {
  try {
    const row = await prisma.lecipmSelfExpansionLearningState.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        hubLiftJson: {},
        blockerLiftJson: {},
        archetypeLiftJson: {},
      },
      update: {},
    });
    return {
      hubLift: (row.hubLiftJson as Record<string, number>) ?? {},
      blockerPenalty: (row.blockerLiftJson as Record<string, number>) ?? {},
      archetypeLift: (row.archetypeLiftJson as Record<string, number>) ?? {},
    };
  } catch {
    return emptyWeights();
  }
}

/** Nudge lifts when a completed outcome reports positive impact (bounded). */
export async function applyPositiveOutcomeLearning(params: {
  entryHub: string;
  archetype: string;
  blockerHint?: string | null;
}): Promise<void> {
  const cur = await loadLearningWeights();
  const hubLift = { ...cur.hubLift };
  const archetypeLift = { ...cur.archetypeLift };
  const blockerPenalty = { ...cur.blockerPenalty };

  hubLift[params.entryHub] = Math.min(1.12, (hubLift[params.entryHub] ?? 1) + 0.02);
  archetypeLift[params.archetype] = Math.min(1.1, (archetypeLift[params.archetype] ?? 1) + 0.015);
  if (params.blockerHint) {
    blockerPenalty[params.blockerHint] = Math.max(0.5, (blockerPenalty[params.blockerHint] ?? 1) - 0.05);
  }

  await prisma.lecipmSelfExpansionLearningState.upsert({
    where: { key: KEY },
    create: {
      key: KEY,
      hubLiftJson: hubLift,
      blockerLiftJson: blockerPenalty,
      archetypeLiftJson: archetypeLift,
    },
    update: {
      hubLiftJson: hubLift,
      blockerLiftJson: blockerPenalty,
      archetypeLiftJson: archetypeLift,
    },
  });
}

export function summarizeLearningPatterns(weights: ExpansionLearningWeights): {
  bestEntryStrategies: Array<{ hub: string; lift: number }>;
  commonBlockers: Array<{ blocker: string; penalty: number }>;
  archetypes: Array<{ archetype: string; lift: number }>;
} {
  const bestEntryStrategies = Object.entries(weights.hubLift)
    .map(([hub, lift]) => ({ hub, lift }))
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 6);
  const commonBlockers = Object.entries(weights.blockerPenalty)
    .map(([blocker, penalty]) => ({ blocker, penalty }))
    .sort((a, b) => b.penalty - a.penalty)
    .slice(0, 8);
  const archetypes = Object.entries(weights.archetypeLift)
    .map(([archetype, lift]) => ({ archetype, lift }))
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 6);
  return { bestEntryStrategies, commonBlockers, archetypes };
}
