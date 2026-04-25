/**
 * Short-lived inventory holds (`AvailabilityBlock` with `BOOKING_HOLD`) for checkout.
 * Default TTL 12 minutes; expired rows are removed by `cleanupExpiredBookingHolds` and ignored by availability checks.
 */

import { AvailabilityBlockType, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { isBookingHoldActive } from "./availability.service";
import { assertInventoryAvailableForNewStay } from "./availability.service";
import { expireStaleBnhubPendingBookings } from "@/lib/bookings/checkAvailability";
import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";

const DEFAULT_TTL_MIN = 12;
const REASON_V = 1;

export function buildHoldReason(holdId: string, expiresAt: Date) {
  return JSON.stringify({ v: REASON_V, holdId, expiresAt: expiresAt.toISOString() });
}

export function parseHoldReasonJson(reason: string | null | undefined): { holdId?: string; expiresAt?: string } {
  if (!reason?.trim()) return {};
  try {
    const o = JSON.parse(reason) as { v?: number; holdId?: string; expiresAt?: string };
    if (!o || typeof o !== "object") return {};
    return { holdId: o.holdId, expiresAt: o.expiresAt };
  } catch {
    return {};
  }
}

export type CreateHoldResult = {
  /** Correlates `reason` JSON for support / logs */
  publicHoldId: string;
  /** Use this with `createBooking({ releaseAvailabilityBlockId })` / `validateBookingHoldByBlockId` */
  blockId: string;
  expiresAt: Date;
  listingId: string;
  checkIn: Date;
  checkOut: Date;
};

type Tx = Prisma.TransactionClient;

/**
 * Reserves the stay range in a Serializable transaction. Fails if inventory is not free.
 */
export async function createBookingHold(
  prisma: {
    $transaction: typeof import("@/lib/db").prisma["$transaction"];
  },
  params: { listingId: string; checkIn: Date; checkOut: Date; ttlMinutes?: number }
): Promise<CreateHoldResult> {
  const ttl = params.ttlMinutes ?? DEFAULT_TTL_MIN;
  const expiresAt = new Date(Date.now() + ttl * 60_000);
  const publicHoldId = randomUUID();
  const startDate = utcDayStart(params.checkIn);
  const endDate = utcDayStart(params.checkOut);
  if (!(endDate > startDate)) {
    throw new Error("Invalid stay range for hold");
  }

  return prisma.$transaction(
    async (tx) => {
      await expireStaleBnhubPendingBookings(tx, params.listingId);
      await assertInventoryAvailableForNewStay(tx, {
        listingId: params.listingId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
      });

      const block = await tx.availabilityBlock.create({
        data: {
          listingId: params.listingId,
          startDate,
          endDate,
          blockType: AvailabilityBlockType.BOOKING_HOLD,
          reason: buildHoldReason(publicHoldId, expiresAt),
        },
        select: { id: true },
      });

      return {
        publicHoldId,
        blockId: block.id,
        expiresAt,
        listingId: params.listingId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 20000 }
  );
}

export async function expireBookingHold(
  prisma: { availabilityBlock: { delete: (a: { where: { id: string } }) => Promise<unknown> } },
  blockId: string
): Promise<void> {
  await prisma.availabilityBlock.delete({ where: { id: blockId } });
}

export type ValidatedHold = {
  id: string;
  listingId: string;
  startDate: Date;
  endDate: Date;
  blockType: AvailabilityBlockType;
  reason: string | null;
};

/**
 * True when the block exists, is `BOOKING_HOLD`, and TTL has not passed.
 */
export async function validateBookingHoldByBlockId(tx: Tx, blockId: string): Promise<ValidatedHold | null> {
  const block = await tx.availabilityBlock.findUnique({
    where: { id: blockId },
    select: { id: true, listingId: true, startDate: true, endDate: true, blockType: true, reason: true },
  });
  if (!block || block.blockType !== AvailabilityBlockType.BOOKING_HOLD) return null;
  if (!isBookingHoldActive(block.reason)) return null;
  return block;
}
