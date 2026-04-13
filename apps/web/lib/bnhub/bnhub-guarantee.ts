import { prisma } from "@/lib/db";
import type { BnhubGuaranteeStatus } from "@prisma/client";

const DEFAULT_TYPE = "trust_backed";

/** Eligible paid / confirmed BNHUB bookings get an active guarantee (idempotent). */
export async function applyGuarantee(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, bookingSource: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
    throw new Error("Guarantee applies only to confirmed or completed bookings");
  }

  const existing = await prisma.bnhubBookingGuarantee.findFirst({
    where: { bookingId, status: { in: ["ACTIVE", "CLAIMED", "RESOLVED"] } },
  });
  if (existing) return existing;

  return prisma.bnhubBookingGuarantee.create({
    data: {
      bookingId,
      guaranteeType: DEFAULT_TYPE,
      status: "ACTIVE",
    },
  });
}

/** Guest claims guarantee after reporting mismatch or issue (support workflow). */
export async function claimGuarantee(bookingId: string, actorUserId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.guestId !== actorUserId) throw new Error("Only the guest can claim this guarantee");

  const row = await prisma.bnhubBookingGuarantee.findFirst({
    where: { bookingId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new Error("No active guarantee for this booking");

  return prisma.bnhubBookingGuarantee.update({
    where: { id: row.id },
    data: { status: "CLAIMED" },
  });
}

export async function resolveGuarantee(guaranteeId: string) {
  return prisma.bnhubBookingGuarantee.update({
    where: { id: guaranteeId },
    data: { status: "RESOLVED" },
  });
}

export async function getGuaranteesForBooking(bookingId: string) {
  return prisma.bnhubBookingGuarantee.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
}

export type GuaranteePublic = {
  id: string;
  bookingId: string;
  guaranteeType: string;
  status: BnhubGuaranteeStatus;
  createdAt: Date;
};
