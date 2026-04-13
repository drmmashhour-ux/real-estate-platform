import type { PrismaClient } from "@prisma/client";
import { getOrCreateAssignmentForSurface } from "@/lib/experiments/get-assignment";
import { parseVariantConfig, type ExperimentUiConfig } from "@/lib/experiments/validators";
import type { ExperimentSurface } from "@/lib/experiments/constants";

export type ResolvedExperimentSurface = {
  experimentId: string;
  experimentSlug: string;
  variantId: string;
  variantKey: string;
  primaryMetric: string;
  config: ExperimentUiConfig;
};

/**
 * Server-only: stable assignment + parsed UI config for a surface (no client-side randomness).
 */
export async function resolveExperimentSurface(
  prisma: PrismaClient,
  surface: ExperimentSurface | string,
  ctx: { sessionId: string; userId: string | null },
): Promise<ResolvedExperimentSurface | null> {
  const { experiment, assignment } = await getOrCreateAssignmentForSurface(prisma, {
    targetSurface: surface,
    sessionId: ctx.sessionId,
    userId: ctx.userId,
  });

  if (!experiment || !assignment) return null;

  return {
    experimentId: experiment.id,
    experimentSlug: experiment.slug,
    variantId: assignment.variant.id,
    variantKey: assignment.variant.variantKey,
    primaryMetric: experiment.primaryMetric,
    config: parseVariantConfig(assignment.variant.configJson),
  };
}

/** Alias for callers that prefer “get config” naming. */
export const getVariantConfig = resolveExperimentSurface;
