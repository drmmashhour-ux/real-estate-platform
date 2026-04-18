import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";

export async function logClosingAnalytics(input: {
  dealId: string;
  eventKey: string;
  payload?: Record<string, unknown>;
}) {
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: null,
      actionKey: `analytics_${input.eventKey}`,
      payload: asInputJsonValue(input.payload ?? {}),
    },
  });
}

export async function logSignatureTiming(input: {
  dealId: string;
  sessionId: string;
  eventKey: "signature_started" | "signature_completed" | "signature_declined";
  msSinceSessionCreate?: number;
}) {
  await logClosingAnalytics({
    dealId: input.dealId,
    eventKey: input.eventKey,
    payload: { sessionId: input.sessionId, msSinceSessionCreate: input.msSinceSessionCreate },
  });
}
