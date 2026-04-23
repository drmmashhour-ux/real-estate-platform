import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

/** Link downstream metrics to an execution row (marketing, leads, booking, revenue predictor, capital allocator). */
export async function linkAutopilotOutcomeToExecution(params: {
  executionId: string;
  outcomeWindow: string;
  baselineBefore: unknown;
  resultAfter: unknown;
  delta: unknown;
  confidence?: number;
}): Promise<void> {
  await prisma.lecipmFullAutopilotExecution.update({
    where: { id: params.executionId },
    data: {
      outcomeWindow: params.outcomeWindow,
      baselineBeforeJson: params.baselineBefore as Prisma.InputJsonValue,
      resultAfterJson: params.resultAfter as Prisma.InputJsonValue,
      outcomeDeltaJson: params.delta as Prisma.InputJsonValue,
      outcomeConfidence: params.confidence ?? undefined,
    },
  });
}
