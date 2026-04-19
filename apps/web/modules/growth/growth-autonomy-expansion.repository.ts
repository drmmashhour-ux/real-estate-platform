/**
 * Singleton expansion governance state — proposals and activations are never silent.
 */

import { prisma } from "@/lib/db";

export type ExpansionTrialActivation = {
  candidateId: string;
  proposedActionKey: string;
  approvedAt: string;
  approvedByUserId: string;
  note?: string;
};

export type ExpansionPendingProposal = {
  candidateId: string;
  proposedAt: string;
  summary: string;
};

export async function getGrowthAutonomyExpansionState(): Promise<{
  freeze: boolean;
  pending: ExpansionPendingProposal[];
  activatedTrials: ExpansionTrialActivation[];
}> {
  try {
    const row = await prisma.growthAutonomyExpansionState.findUnique({
      where: { id: "singleton" },
    });
    if (!row) {
      return { freeze: false, pending: [], activatedTrials: [] };
    }
    return {
      freeze: !!row.freeze,
      pending: (row.pendingJson as ExpansionPendingProposal[]) ?? [],
      activatedTrials: (row.activatedTrialsJson as ExpansionTrialActivation[]) ?? [],
    };
  } catch {
    return { freeze: false, pending: [], activatedTrials: [] };
  }
}

export async function saveGrowthAutonomyExpansionState(payload: {
  freeze?: boolean;
  pending?: ExpansionPendingProposal[];
  activatedTrials?: ExpansionTrialActivation[];
}): Promise<void> {
  try {
    const cur = await getGrowthAutonomyExpansionState();
    const freeze = payload.freeze ?? cur.freeze;
    const pending = payload.pending ?? cur.pending;
    const activatedTrials = payload.activatedTrials ?? cur.activatedTrials;
    await prisma.growthAutonomyExpansionState.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        freeze,
        pendingJson: pending,
        activatedTrialsJson: activatedTrials,
      },
      update: {
        freeze,
        pendingJson: pending,
        activatedTrialsJson: activatedTrials,
      },
    });
  } catch {
    /* noop */
  }
}
