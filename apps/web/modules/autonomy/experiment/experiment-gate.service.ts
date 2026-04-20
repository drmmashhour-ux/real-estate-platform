import { prisma } from "@/lib/db";
import { holdoutEntityIdForAutonomyScope } from "./experiment-entity.service";

export type ExperimentGateResult =
  | { execute: true }
  | { execute: false; experimentId: string; entityId: string; reason: string };

/**
 * If a **running** autonomy experiment matches this action and the entity is in **control**, skip autonomous
 * execution (policy already passed). Does not mutate policy — only suppresses executor.
 */
export async function gateAutonomyExperimentExecution(params: {
  scopeType: string;
  scopeId: string;
  domain: string;
  signalKey: string | null | undefined;
  actionType: string;
}): Promise<ExperimentGateResult> {
  const now = new Date();
  const signalKey = params.signalKey ?? "";

  const exp = await prisma.autonomyExperiment.findFirst({
    where: {
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      domain: params.domain,
      signalKey,
      actionType: params.actionType,
      status: "running",
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    orderBy: { startDate: "desc" },
  });

  if (!exp) {
    return { execute: true };
  }

  const entityId = holdoutEntityIdForAutonomyScope(params.scopeType, params.scopeId);

  const assignment = await prisma.autonomyExperimentAssignment.findUnique({
    where: {
      experimentId_entityId: {
        experimentId: exp.id,
        entityId,
      },
    },
  });

  if (!assignment) {
    await prisma.autonomyEventLog.create({
      data: {
        scopeType: params.scopeType,
        scopeId: params.scopeId,
        eventType: "experiment_assignment_missing",
        message:
          "Running autonomy experiment matched but entity has no assignment row — executing (initializeExperiment not run).",
        meta: { experimentId: exp.id, entityId, domain: params.domain, actionType: params.actionType },
      },
    });
    return { execute: true };
  }

  if (assignment.group === "control") {
    return {
      execute: false,
      experimentId: exp.id,
      entityId,
      reason: `Holdout control arm — autonomous execution suppressed (experiment ${exp.name}).`,
    };
  }

  return { execute: true };
}
