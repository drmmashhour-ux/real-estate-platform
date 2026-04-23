import { prisma } from "@/lib/db";

export type AllocationWeights = {
  buySignalWeight: number;
  occupancyWeight: number;
  revparWeight: number;
  upliftWeight: number;
  riskPenalty: number;
};

const DEFAULT_WEIGHTS: AllocationWeights = {
  buySignalWeight: 20,
  occupancyWeight: 10,
  revparWeight: 8,
  upliftWeight: 12,
  riskPenalty: 25,
};

/** Loads current weights from DB (AutonomyRuleWeight) or returns defaults. */
export async function getAllocationWeights(scopeId: string = "global"): Promise<AllocationWeights> {
  const weights = await prisma.autonomyRuleWeight.findMany({
    where: {
      domain: "CAPITAL_ALLOCATOR",
      scopeId,
    },
  });

  if (weights.length === 0) {
    return DEFAULT_WEIGHTS;
  }

  const result = { ...DEFAULT_WEIGHTS };
  weights.forEach((w) => {
    if (w.signalKey === "buySignalWeight") result.buySignalWeight = w.weight;
    if (w.signalKey === "occupancyWeight") result.occupancyWeight = w.weight;
    if (w.signalKey === "revparWeight") result.revparWeight = w.weight;
    if (w.signalKey === "upliftWeight") result.upliftWeight = w.weight;
    if (w.signalKey === "riskPenalty") result.riskPenalty = w.weight;
  });

  return result;
}

/** Updates weights based on learning loop outcomes. Persists to AutonomyRuleWeight. */
export async function updateAllocationWeights(
  updates: Partial<AllocationWeights>,
  scopeId: string = "global"
): Promise<void> {
  const entries = Object.entries(updates);

  for (const [key, value] of entries) {
    await prisma.autonomyRuleWeight.upsert({
      where: {
        id: `capital_${scopeId}_${key}`, // Deterministic ID for weights
      },
      create: {
        id: `capital_${scopeId}_${key}`,
        scopeType: "portfolio",
        scopeId,
        domain: "CAPITAL_ALLOCATOR",
        signalKey: key,
        actionType: "reweight",
        weight: value as number,
      },
      update: {
        weight: value as number,
      },
    });
  }
}
