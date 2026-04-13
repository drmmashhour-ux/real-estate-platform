import type { DealPaymentStatus, DealPaymentType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DEAL_ROOM_EVENT } from "./constants";
import { addDealRoomEvent } from "./add-event";

export async function addDealRoomPayment(input: {
  dealRoomId: string;
  paymentType: DealPaymentType;
  status?: DealPaymentStatus;
  amountCents?: number | null;
  currency?: string | null;
  paymentRef?: string | null;
  actorUserId?: string | null;
}) {
  const row = await prisma.dealRoomPayment.create({
    data: {
      dealRoomId: input.dealRoomId,
      paymentType: input.paymentType,
      status: input.status ?? "pending",
      amountCents: input.amountCents ?? undefined,
      currency: input.currency ?? undefined,
      paymentRef: input.paymentRef ?? undefined,
    },
  });
  await addDealRoomEvent({
    dealRoomId: input.dealRoomId,
    eventType: DEAL_ROOM_EVENT.PAYMENT_UPDATED,
    title: `Payment: ${input.paymentType.replace(/_/g, " ")}`,
    body: `Status ${row.status}${row.amountCents != null ? ` · ${(row.amountCents / 100).toFixed(2)} ${row.currency ?? ""}` : ""}`,
    metadataJson: { paymentId: row.id },
    createdByUserId: input.actorUserId ?? undefined,
  });
  return row;
}
