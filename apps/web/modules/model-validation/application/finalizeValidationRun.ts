import type { PrismaClient } from "@prisma/client";
import { refreshAgreementsForRun, updateRunStatus } from "../infrastructure/validationRepository";

export async function finalizeValidationRun(db: PrismaClient, runId: string) {
  await refreshAgreementsForRun(db, runId);
  return updateRunStatus(db, runId, "completed", new Date());
}
