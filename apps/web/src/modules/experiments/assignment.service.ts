import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

function pickVariantKey(variantKeys: string[], salt: string): string {
  if (variantKeys.length === 0) return "control";
  const h = createHash("sha256").update(salt).digest();
  const n = h.readUInt32BE(0) / 0xffffffff;
  return variantKeys[Math.min(variantKeys.length - 1, Math.floor(n * variantKeys.length))]!;
}

/**
 * Deterministic sticky assignment per experiment + session (and user when present).
 */
export async function getOrCreateExperimentAssignment(params: {
  experimentSlug: string;
  sessionId: string;
  userId?: string | null;
}): Promise<{ variantKey: string; experimentId: string } | null> {
  if (!engineFlags.experimentsV1) return null;

  const experiment = await prisma.experiment.findUnique({
    where: { slug: params.experimentSlug },
    include: { variants: true },
  });
  if (!experiment || experiment.status !== "running") return null;

  const existing = await prisma.experimentAssignment.findUnique({
    where: {
      experimentId_sessionId: { experimentId: experiment.id, sessionId: params.sessionId },
    },
    include: { variant: true },
  });
  if (existing) {
    return { variantKey: existing.variant.variantKey, experimentId: experiment.id };
  }

  const keys = experiment.variants.map((v) => v.variantKey).sort();
  const salt = `${experiment.id}:${params.sessionId}:${params.userId ?? ""}`;
  const variantKey = pickVariantKey(keys, salt);
  const variant = experiment.variants.find((v) => v.variantKey === variantKey) ?? experiment.variants[0];
  if (!variant) return null;

  await prisma.experimentAssignment.create({
    data: {
      experimentId: experiment.id,
      variantId: variant.id,
      sessionId: params.sessionId,
      userId: params.userId ?? null,
    },
  });

  return { variantKey: variant.variantKey, experimentId: experiment.id };
}
