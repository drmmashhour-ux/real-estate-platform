import type { LecipmSdTransaction } from "@prisma/client";

export type TransactionPartyRole = "SELLER" | "BUYER" | "BROKER";

export type CreateTransactionInput = {
  brokerId: string;
  transactionType: string;
  title?: string | null;
  status?: string;
  listingId?: string | null;
  propertyId?: string | null;
};

export type AddPartyInput = {
  transactionId: string;
  role: TransactionPartyRole;
  displayName: string;
  email?: string | null;
  phone?: string | null;
};

/** API / UI wire format — always includes SD number */
export type TransactionWire = Pick<
  LecipmSdTransaction,
  "id" | "transactionNumber" | "transactionType" | "status" | "title" | "listingId" | "propertyId" | "brokerId"
> & {
  openedAt: string;
  createdAt: string;
  updatedAt: string;
};

export function toTransactionWire(row: LecipmSdTransaction): TransactionWire {
  return {
    id: row.id,
    transactionNumber: row.transactionNumber,
    transactionType: row.transactionType,
    status: row.status,
    title: row.title,
    listingId: row.listingId,
    propertyId: row.propertyId,
    brokerId: row.brokerId,
    openedAt: row.openedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
