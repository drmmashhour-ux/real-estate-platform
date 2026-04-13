import type { FraudEntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateFraudScoreForEntity } from "@/lib/fraud/update-fraud-score";

export type RecordFraudSignalInput = {
  entityType: FraudEntityType;
  entityId: string;
  signalType: string;
  signalValue?: string | null;
  riskPoints: number;
  metadataJson?: Prisma.InputJsonValue;
};

/**
 * Inserts a signal and recomputes aggregated policy score + optional fraud case.
 */
export async function recordFraudSignal(input: RecordFraudSignalInput): Promise<void> {
  await prisma.fraudSignalEvent.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      signalType: input.signalType,
      signalValue: input.signalValue ?? undefined,
      riskPoints: input.riskPoints,
      metadataJson: (input.metadataJson ?? {}) as Prisma.InputJsonValue,
    },
  });
  await updateFraudScoreForEntity(input.entityType, input.entityId);
}
