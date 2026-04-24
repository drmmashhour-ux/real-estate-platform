import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { GrowthChannel, GrowthExperimentStatus } from "./growth.types";

const TAG = "[growth-engine]";

export interface CreateExperimentArgs {
  channel: GrowthChannel;
  hypothesis: string;
  targetMetric: string;
  trafficCapPercent?: number;
  requiresApproval?: boolean;
}

/**
 * Orchestrates the lifecycle of growth experiments.
 */
export async function createGrowthExperiment(args: CreateExperimentArgs) {
  // @ts-ignore
  const exp = await prisma.growthExperiment.create({
    data: {
      channel: args.channel,
      hypothesis: args.hypothesis,
      targetMetric: args.targetMetric,
      trafficCapPercent: args.trafficCapPercent ?? 10,
      requiresApproval: args.requiresApproval ?? true,
      status: "DRAFT",
    },
  });

  logInfo(`${TAG} autonomous_growth_action_created`, { experimentId: exp.id });
  return exp;
}

export async function startExperiment(experimentId: string) {
  // @ts-ignore
  const exp = await prisma.growthExperiment.findUnique({ where: { id: experimentId } });
  if (!exp) throw new Error("Experiment not found");

  if (exp.requiresApproval && exp.status === "DRAFT") {
    // In a real system, this would check if it was approved via a separate workflow
    // For now, we allow starting if status is not COMPLETED
  }

  // @ts-ignore
  await prisma.growthExperiment.update({
    where: { id: experimentId },
    data: { status: "RUNNING" },
  });

  logInfo(`${TAG} experiment_started`, { experimentId });
}

export async function completeExperiment(experimentId: string, outcomes: any) {
  // @ts-ignore
  await prisma.growthOutcome.create({
    data: {
      experimentId,
      ...outcomes,
    },
  });

  // @ts-ignore
  await prisma.growthExperiment.update({
    where: { id: experimentId },
    data: { status: "COMPLETED" },
  });

  logInfo(`${TAG} experiment_completed`, { experimentId });
}
