/**
 * Read-only dashboard queries over `LearningPattern` — does not alter the learning engine.
 */
import type { LearningPattern } from "@prisma/client";

import { prisma } from "@/lib/db";

export type LearningPatternSortField = "confidence" | "impactScore" | "updatedAt";

export type LearningPatternsQuery = {
  sortBy?: LearningPatternSortField;
  sortDir?: "asc" | "desc";
  /** Filter patterns with sampleSize >= this value (evidence floor). */
  minSampleSize?: number;
  take?: number;
};

export type LearningPatternRow = Pick<
  LearningPattern,
  "id" | "pattern" | "confidence" | "impactScore" | "sampleSize" | "createdAt" | "updatedAt"
>;

export async function listLearningPatternsForDashboard(
  q: LearningPatternsQuery = {}
): Promise<LearningPatternRow[]> {
  const sortBy = q.sortBy ?? "confidence";
  const sortDir = q.sortDir ?? "desc";
  const take = Math.min(Math.max(q.take ?? 200, 1), 500);
  const minSampleSize = q.minSampleSize ?? 0;

  const orderBy =
    sortBy === "confidence" ?
      { confidence: sortDir }
    : sortBy === "impactScore" ?
      { impactScore: sortDir }
    : { updatedAt: sortDir };

  return prisma.learningPattern.findMany({
    where:
      minSampleSize > 0 ?
        {
          sampleSize: { gte: minSampleSize },
        }
      : undefined,
    orderBy,
    take,
    select: {
      id: true,
      pattern: true,
      confidence: true,
      impactScore: true,
      sampleSize: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
