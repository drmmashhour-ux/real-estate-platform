import type { PrismaClient } from "@prisma/client";
import type { ExperimentEventName } from "@/lib/experiments/constants";

export async function trackExperimentEvent(
  prisma: PrismaClient,
  params: {
    experimentId: string;
    variantId: string;
    sessionId: string;
    userId: string | null;
    eventName: ExperimentEventName;
    metadata?: Record<string, unknown>;
  },
) {
  await prisma.experimentEvent.create({
    data: {
      experimentId: params.experimentId,
      variantId: params.variantId,
      sessionId: params.sessionId,
      userId: params.userId ?? undefined,
      eventName: params.eventName,
      metadataJson: (params.metadata ?? {}) as object,
    },
  });
}
