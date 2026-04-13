import { DealRequestItemStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";
import { recomputeRequestFulfillment } from "@/modules/document-requests/request-fulfilment.service";
import type { ItemValidationOutcome } from "./intake-validation.types";

export async function validateRequestItem(
  dealId: string,
  requestId: string,
  itemId: string,
  input: {
    status: DealRequestItemStatus;
    sourceDocumentId?: string | null;
    validatedByUserId: string;
  }
): Promise<ItemValidationOutcome | null> {
  const item = await prisma.dealRequestItem.findFirst({
    where: { id: itemId, dealRequestId: requestId, dealRequest: { dealId } },
  });
  if (!item) return null;

  const now = new Date();
  const data: {
    status: DealRequestItemStatus;
    sourceDocumentId?: string | null;
    validatedAt?: Date | null;
    validatedByUserId?: string | null;
    receivedAt?: Date | null;
  } = {
    status: input.status,
    sourceDocumentId: input.sourceDocumentId ?? undefined,
  };

  if (input.status === DealRequestItemStatus.VALIDATED) {
    data.validatedAt = now;
    data.validatedByUserId = input.validatedByUserId;
  }
  if (input.status === DealRequestItemStatus.RECEIVED) {
    data.receivedAt = now;
  }

  await prisma.dealRequestItem.update({
    where: { id: itemId },
    data,
  });

  await recomputeRequestFulfillment(requestId);

  let outcome: ItemValidationOutcome = "partial";
  if (input.status === DealRequestItemStatus.VALIDATED) outcome = "fulfilled";
  else if (input.status === DealRequestItemStatus.REJECTED) outcome = "invalid";
  else if (input.status === DealRequestItemStatus.RECEIVED) outcome = "broker_review_required";

  await logCoordinationAudit({
    dealId,
    action: "item_validated",
    actorUserId: input.validatedByUserId,
    entityType: "DealRequestItem",
    entityId: itemId,
    payload: { status: input.status, outcome },
  });

  return outcome;
}
