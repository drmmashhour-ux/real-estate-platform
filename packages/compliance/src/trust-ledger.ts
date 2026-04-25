import { prisma } from "@/lib/db";

export async function createTrustLedgerEntry(input: {
  ownerType: string;
  ownerId: string;
  trustDepositId?: string | null;
  listingId?: string | null;
  dealId?: string | null;
  entryType: "receipt" | "hold" | "release" | "refund" | "adjustment";
  direction: "debit" | "credit";
  amountCents: number;
  referenceNumber?: string | null;
  notes?: string | null;
  createdById?: string | null;
}) {
  return prisma.trustLedgerEntry.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      trustDepositId: input.trustDepositId ?? null,
      listingId: input.listingId ?? null,
      dealId: input.dealId ?? null,
      entryType: input.entryType,
      direction: input.direction,
      amountCents: input.amountCents,
      referenceNumber: input.referenceNumber ?? null,
      notes: input.notes ?? null,
      createdById: input.createdById ?? null,
    },
  });
}
