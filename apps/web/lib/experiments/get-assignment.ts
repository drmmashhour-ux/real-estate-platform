import type { Prisma, PrismaClient } from "@prisma/client";
import { getActiveExperimentForSurface } from "@/lib/experiments/get-active-experiment";
import { assignVariantForSession } from "@/lib/experiments/assign-variant";

type Db = PrismaClient | Prisma.TransactionClient;

export async function getExistingAssignment(
  db: Db,
  experimentId: string,
  sessionId: string,
  userId: string | null,
) {
  if (userId) {
    const byUser = await db.experimentAssignment.findFirst({
      where: { experimentId, userId },
      include: { variant: true },
    });
    if (byUser) return byUser;
  }
  return db.experimentAssignment.findUnique({
    where: { experimentId_sessionId: { experimentId, sessionId } },
    include: { variant: true },
  });
}

/**
 * Resolves assignment for a running experiment on `targetSurface`, creating a row when needed.
 */
export async function getOrCreateAssignmentForSurface(
  db: Db,
  params: { targetSurface: string; sessionId: string; userId: string | null },
) {
  const exp = await getActiveExperimentForSurface(db, params.targetSurface);
  if (!exp) return { experiment: null as const, assignment: null as const };

  const existing = await getExistingAssignment(db, exp.id, params.sessionId, params.userId);
  if (existing) {
    if (params.userId && !existing.userId) {
      const updated = await db.experimentAssignment.update({
        where: { id: existing.id },
        data: { userId: params.userId },
        include: { variant: true },
      });
      return { experiment: exp, assignment: updated };
    }
    return { experiment: exp, assignment: existing };
  }

  const assignment = await assignVariantForSession(db, {
    experimentId: exp.id,
    sessionId: params.sessionId,
    userId: params.userId,
    trafficSplitJson: exp.trafficSplitJson,
    variants: exp.variants.map((v) => ({ id: v.id, variantKey: v.variantKey })),
    stoppedVariantKeys: exp.stoppedVariantKeys,
  });

  return { experiment: exp, assignment };
}
