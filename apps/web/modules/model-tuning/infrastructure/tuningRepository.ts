import type { PrismaClient } from "@prisma/client";
import type { TuningProfileConfig } from "@/modules/scoring/tuningProfile";

export async function createTuningProfile(
  db: PrismaClient,
  args: {
    name?: string | null;
    description?: string | null;
    basedOnValidationRunId?: string | null;
    config: TuningProfileConfig;
    createdBy: string;
  },
) {
  return db.tuningProfile.create({
    data: {
      name: args.name ?? null,
      description: args.description ?? null,
      basedOnValidationRunId: args.basedOnValidationRunId ?? null,
      config: args.config as object,
      createdBy: args.createdBy,
    },
  });
}

export async function getTuningProfile(db: PrismaClient, id: string) {
  return db.tuningProfile.findUnique({ where: { id } });
}

export async function recordComparison(
  db: PrismaClient,
  args: {
    tuningProfileId: string;
    validationRunId: string;
    beforeMetrics: object;
    afterMetrics: object;
  },
) {
  return db.tuningComparison.create({
    data: {
      tuningProfileId: args.tuningProfileId,
      validationRunId: args.validationRunId,
      beforeMetrics: args.beforeMetrics as object,
      afterMetrics: args.afterMetrics as object,
    },
  });
}
