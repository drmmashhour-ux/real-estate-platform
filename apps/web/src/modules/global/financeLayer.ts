import { prisma } from "@/lib/db";

const db = prisma as unknown as {
  globalEscrowHold: { create: (args: object) => Promise<{ id: string }>; update: (args: object) => Promise<unknown> };
  globalPayoutQueueItem: { create: (args: object) => Promise<unknown> };
  globalDepositRecord: { create: (args: object) => Promise<unknown> };
};

export async function createEscrowHold(input: {
  bookingId?: string | null;
  amountCents: number;
  currency: string;
  metadata?: object;
}) {
  return db.globalEscrowHold.create({
    data: {
      bookingId: input.bookingId ?? null,
      amountCents: input.amountCents,
      currency: input.currency.toLowerCase(),
      state: "held",
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function releaseEscrowHold(id: string, state: "released_to_host" | "refunded_guest" = "released_to_host") {
  return db.globalEscrowHold.update({
    where: { id },
    data: { state, releasedAt: new Date() },
  });
}

export async function enqueuePayout(input: {
  beneficiaryUserId: string;
  amountCents: number;
  currency: string;
  scheduledFor?: Date;
  metadata?: object;
}) {
  return db.globalPayoutQueueItem.create({
    data: {
      beneficiaryUserId: input.beneficiaryUserId,
      amountCents: input.amountCents,
      currency: input.currency.toLowerCase(),
      state: "pending",
      scheduledFor: input.scheduledFor ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function recordDeposit(input: {
  bookingId?: string | null;
  amountCents: number;
  currency: string;
  state?: string;
  metadata?: object;
}) {
  return db.globalDepositRecord.create({
    data: {
      bookingId: input.bookingId ?? null,
      amountCents: input.amountCents,
      currency: input.currency.toLowerCase(),
      state: input.state ?? "captured",
      metadata: input.metadata ?? undefined,
    },
  });
}
