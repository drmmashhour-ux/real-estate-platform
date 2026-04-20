import { prisma } from "@/lib/db";
import { assignToGroup } from "./experiment-assignment.service";

/**
 * Creates deterministic control/treatment rows for each BNHub listing under `scopeId` (host user id)
 * plus one aggregate `portfolio:${scopeId}` row for portfolio-scoped autonomy cycles.
 */
export async function initializeExperiment(experimentId: string) {
  const exp = await prisma.autonomyExperiment.findUnique({
    where: { id: experimentId },
  });

  if (!exp) {
    throw new Error("Experiment not found");
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: exp.scopeId },
    select: { id: true },
  });

  const portfolioEntityId = `portfolio:${exp.scopeId}`;
  const entities = [...listings.map((l) => l.id), portfolioEntityId];

  let created = 0;

  for (const entityId of entities) {
    const group = assignToGroup(entityId, exp.trafficSplit);

    await prisma.autonomyExperimentAssignment.upsert({
      where: {
        experimentId_entityId: {
          experimentId: exp.id,
          entityId,
        },
      },
      update: {},
      create: {
        experimentId: exp.id,
        entityId,
        group,
      },
    });
    created += 1;
  }

  await prisma.autonomyEventLog.create({
    data: {
      scopeType: exp.scopeType,
      scopeId: exp.scopeId,
      eventType: "experiment_initialized",
      message: `Autonomy holdout assignments materialized (${created} entities; deterministic split ${exp.trafficSplit}).`,
      meta: { experimentId: exp.id, listings: listings.length, portfolioEntityId },
    },
  });

  return { experimentId: exp.id, assignments: created };
}
