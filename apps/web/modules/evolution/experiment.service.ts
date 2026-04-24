import { prisma } from "@/lib/db";
import type { EvolutionDomain } from "./evolution.types";
import { logEvolution } from "./evolution-logger";
import { createRolloutDraftFromEvolutionExperiment } from "@/modules/rollout/rollout-policy.service";

export async function createDraftExperiment(args: {
  experimentKey: string;
  name: string;
  domain: EvolutionDomain;
  armsJson: Record<string, unknown>;
  trafficCapPercent?: number;
  requiresHumanApproval?: boolean;
  createdByUserId?: string | null;
}) {
  const row = await prisma.evolutionSafeExperiment.create({
    data: {
      experimentKey: args.experimentKey,
      name: args.name,
      domain: args.domain,
      status: "DRAFT",
      armsJson: args.armsJson as object,
      trafficCapPercent: Math.min(50, Math.max(1, args.trafficCapPercent ?? 10)),
      requiresHumanApproval: args.requiresHumanApproval ?? true,
      createdByUserId: args.createdByUserId ?? null,
    },
  });
  logEvolution("strategy_applied", {
    phase: "experiment_draft",
    experimentKey: row.experimentKey,
  });
  return row;
}

export async function approveExperiment(experimentId: string, approverUserId: string) {
  const row = await prisma.evolutionSafeExperiment.update({
    where: { id: experimentId },
    data: {
      status: "LIVE",
      approvedByUserId: approverUserId,
      approvedAt: new Date(),
    },
  });
  logEvolution("strategy_applied", {
    phase: "experiment_live",
    experimentKey: row.experimentKey,
    approverUserId,
  });
  void createRolloutDraftFromEvolutionExperiment(row, approverUserId).catch(() => {});
  return row;
}

export async function pauseExperiment(experimentId: string) {
  return prisma.evolutionSafeExperiment.update({
    where: { id: experimentId },
    data: { status: "PAUSED" },
  });
}

export async function listExperiments(domain?: EvolutionDomain) {
  return prisma.evolutionSafeExperiment.findMany({
    ...(domain ? { where: { domain } } : {}),
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}
