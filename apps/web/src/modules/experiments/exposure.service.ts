import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { logProductEvent } from "@/src/modules/events/event.service";
import { getOrCreateExperimentAssignment } from "./assignment.service";

/**
 * Logs sticky assignment + product exposure event (safe; no PII in metadata).
 */
export async function recordExperimentExposure(params: {
  experimentSlug: string;
  sessionId: string;
  userId?: string | null;
  surface?: string;
}): Promise<{ variantKey: string | null; experimentId: string | null }> {
  if (!engineFlags.experimentsV1) return { variantKey: null, experimentId: null };

  const assign = await getOrCreateExperimentAssignment({
    experimentSlug: params.experimentSlug,
    sessionId: params.sessionId,
    userId: params.userId,
  });
  if (!assign) return { variantKey: null, experimentId: null };

  await logProductEvent({
    eventType: "experiment_exposure",
    userId: params.userId,
    sessionId: params.sessionId,
    entityType: "experiment",
    entityId: assign.experimentId,
    metadata: {
      variantKey: assign.variantKey,
      surface: params.surface,
    },
  });

  const variantRow = await prisma.experimentVariant.findFirst({
    where: { experimentId: assign.experimentId, variantKey: assign.variantKey },
  });
  if (variantRow) {
    await prisma.experimentEvent
      .create({
        data: {
          experimentId: assign.experimentId,
          variantId: variantRow.id,
          sessionId: params.sessionId,
          userId: params.userId ?? null,
          eventName: "exposure",
          metadataJson: { surface: params.surface ?? "unknown" },
        },
      })
      .catch(() => {});
  }

  return { variantKey: assign.variantKey, experimentId: assign.experimentId };
}
