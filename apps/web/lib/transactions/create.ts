import { prisma } from "@/lib/db";
import { recordTransactionEvent } from "./events";
import type { TransactionStatus } from "./constants";
import { PrivacyLaunchGuard } from "@/modules/privacy/utils/launch-guards";

export interface CreateTransactionInput {
  propertyIdentityId: string;
  listingId?: string | null;
  buyerId: string;
  sellerId: string;
  brokerId?: string | null;
}

export async function createTransaction(input: CreateTransactionInput): Promise<{ id: string; status: TransactionStatus }> {
  // Enforce Privacy Gate for Buyer
  await PrivacyLaunchGuard.assertTransactionGate(input.buyerId);

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
