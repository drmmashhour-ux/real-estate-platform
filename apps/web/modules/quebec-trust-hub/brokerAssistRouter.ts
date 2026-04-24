import { prisma } from "@/lib/db";
import { logTurboDraftEvent } from "../turbo-form-drafting/auditLogger";

export async function requestBrokerAssist(args: {
  draftId: string;
  userId?: string;
  reasonFr?: string;
}) {
  const { draftId, userId, reasonFr } = args;

  // @ts-ignore
  const request = await prisma.brokerAssistRequest.create({
    data: {
      draftId,
      userId: userId || null,
      status: "REQUESTED",
      reasonFr
    }
  });

  await logTurboDraftEvent({
    draftId,
    userId,
    eventKey: "broker_assist_requested",
    severity: "INFO",
    payload: { requestId: request.id }
  });

  return request;
}
