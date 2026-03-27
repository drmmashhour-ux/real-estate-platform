import { prisma } from "@/lib/db";
import { recordTransactionEvent } from "./events";
import type { TransactionStatus } from "./constants";

export interface CreateTransactionInput {
  propertyIdentityId: string;
  listingId?: string | null;
  buyerId: string;
  sellerId: string;
  brokerId?: string | null;
}

export async function createTransaction(input: CreateTransactionInput): Promise<{ id: string; status: TransactionStatus }> {
  const tx = await prisma.realEstateTransaction.create({
    data: {
      propertyIdentityId: input.propertyIdentityId,
      listingId: input.listingId ?? null,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      brokerId: input.brokerId ?? null,
      status: "offer_submitted",
    },
  });
  await recordTransactionEvent(tx.id, "offer_submitted", { buyerId: input.buyerId, sellerId: input.sellerId }, input.buyerId);
  return { id: tx.id, status: tx.status as TransactionStatus };
}
