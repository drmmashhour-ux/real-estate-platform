import { prisma } from "@/lib/db";
import { abTestingFlags, engineFlags } from "@/config/feature-flags";
import { assignVariant, type AssignVariantResult } from "./variant-assignment.service";
import type { ExperimentDomain } from "./ab-testing.types";
import { parseVariantConfig, type ExperimentUiConfig } from "@/lib/experiments/validators";

export type SurfaceContext = {
  sessionId?: string | null;
  userId?: string | null;
  anonymousId?: string | null;
};

/**
 * Returns first running experiment for a surface (`Experiment.targetSurface`).
 */
export async function getActiveExperimentForSurface(surface: string) {
  if (!abTestingFlags.abTestingV1 && !engineFlags.experimentsV1) return null;
  return prisma.experiment.findFirst({
    where: { targetSurface: surface, status: "running" },
    include: { variants: true },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Assigns a variant for the active running experiment on this surface — safe no-op when off.
 */
export async function getActiveExperimentVariantForSurface(surface: string, ctx: SurfaceContext) {
  const exp = await getActiveExperimentForSurface(surface);
  if (!exp) return { experiment: null, assignment: null as AssignVariantResult | null };
  const res = await assignVariant({
    experimentId: exp.id,
    sessionId: ctx.sessionId,
    userId: ctx.userId,
    anonymousId: ctx.anonymousId,
  });
  return { experiment: exp, assignment: res as AssignVariantResult };
}

export function renderVariantText(
  config: unknown,
  key: "headline" | "ctaText" | "subhead",
  defaultCopy: string,
): string {
  let cfg: ExperimentUiConfig;
  try {
    cfg = parseVariantConfig(config);
  } catch {
    return defaultCopy;
  }
  if (key === "headline" && cfg.headline) return cfg.headline;
  if (key === "ctaText" && cfg.ctaText) return cfg.ctaText;
  if (key === "subhead" && cfg.subhead) return cfg.subhead;
  return defaultCopy;
}

export function uiConfigFromPayload(config: unknown): ExperimentUiConfig {
  try {
    return parseVariantConfig(config);
  } catch {
    return {};
  }
}

export type { ExperimentDomain };
