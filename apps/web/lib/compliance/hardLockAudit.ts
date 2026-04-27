import "server-only";

import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { monolithPrisma } from "@/lib/db";

const BOOKING_CREATED = "compliance_hardlock.booking_created";
const PAYMENT_OK = "compliance_hardlock.payment_confirmed";
const LISTING_LIVE = "compliance_hardlock.listing_publish";

/**
 * Durable marketplace event + optional compliance audit row (when monolith user is known).
 */
export async function auditHardLockBookingCreated(args: {
  bookingId: string;
  guestId: string;
  listingId: string;
}): Promise<void> {
  if (!flags.COMPLIANCE_HARD_LOCK) return;
  void writeMarketplaceEvent(BOOKING_CREATED, {
    bookingId: args.bookingId,
    guestId: args.guestId,
    listingId: args.listingId,
  }).catch(() => {});
  try {
    await monolithPrisma.complianceAuditLog.create({
      data: {
        actorUserId: args.guestId,
        actionKey: BOOKING_CREATED,
        payload: { bookingId: args.bookingId, listingId: args.listingId },
      },
    });
  } catch {
    // non-fatal
  }
}

export async function auditHardLockPaymentConfirmed(args: {
  bookingId: string;
  guestId: string;
  amountCents: number;
}): Promise<void> {
  if (!flags.COMPLIANCE_HARD_LOCK) return;
  void writeMarketplaceEvent(PAYMENT_OK, {
    bookingId: args.bookingId,
    guestId: args.guestId,
    amountCents: args.amountCents,
  }).catch(() => {});
  try {
    await monolithPrisma.complianceAuditLog.create({
      data: {
        actorUserId: args.guestId,
        actionKey: PAYMENT_OK,
        payload: { bookingId: args.bookingId, amountCents: args.amountCents },
      },
    });
  } catch {
    // non-fatal
  }
}

export async function auditHardLockListingPublish(args: {
  listingId: string;
  actorUserId: string;
}): Promise<void> {
  if (!flags.COMPLIANCE_HARD_LOCK) return;
  void writeMarketplaceEvent(LISTING_LIVE, {
    listingId: args.listingId,
    actorUserId: args.actorUserId,
  }).catch(() => {});
  try {
    await monolithPrisma.complianceAuditLog.create({
      data: {
        actorUserId: args.actorUserId,
        actionKey: LISTING_LIVE,
        payload: { listingId: args.listingId },
      },
    });
  } catch {
    // non-fatal
  }
}
