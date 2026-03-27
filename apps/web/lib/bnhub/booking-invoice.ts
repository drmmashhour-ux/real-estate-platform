import type {
  Booking,
  BnhubBookingInvoice,
  Payment,
  ShortTermListing,
  User,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type BookingInvoiceRow = Booking & {
  listing: Pick<ShortTermListing, "ownerId" | "title">;
  guest: Pick<User, "id" | "name">;
  payment: Payment | null;
  bnhubInvoice: BnhubBookingInvoice | null;
};

export type BookingInvoiceJson = {
  bookingId: string;
  confirmationCode: string | null;
  guestName: string | null;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  /** Total charged in cents (guest total). */
  totalAmountCents: number;
  platformFeeCents: number | null;
  hostPayoutCents: number | null;
  paymentStatus: string;
  /** ISO datetime — invoice issued or last payment update. */
  date: string;
  stripeSessionId: string | null;
  paymentIntentId: string | null;
  /** Display invoice number (derived). */
  invoiceNumber: string;
};

export async function assertBookingInvoiceAccess(
  bookingId: string,
  userId: string | null
): Promise<
  | { ok: true; booking: BookingInvoiceRow }
  | { ok: false; status: number; error: string }
> {
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in required" };
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { ownerId: true, title: true } },
      guest: { select: { id: true, name: true } },
      payment: true,
      bnhubInvoice: true,
    },
  });
  if (!booking) {
    return { ok: false, status: 404, error: "Booking not found" };
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = dbUser?.role ?? "USER";
  const isAdmin = role === "ADMIN";
  const isGuest = booking.guestId === userId;
  const isHost = booking.listing.ownerId === userId;
  if (!isAdmin && !isGuest && !isHost) {
    return { ok: false, status: 403, error: "Not allowed to view this invoice" };
  }
  return { ok: true, booking };
}

/** Guest-facing invoices: total paid only — no platform / host settlement lines. */
export function redactBnhubInvoiceForGuest(j: BookingInvoiceJson): BookingInvoiceJson {
  return { ...j, platformFeeCents: null, hostPayoutCents: null };
}

export function bookingToInvoiceJson(booking: BookingInvoiceRow): BookingInvoiceJson {
  const pay = booking.payment;
  const inv = booking.bnhubInvoice;
  const total =
    inv?.totalAmountCents ??
    pay?.amountCents ??
    booking.totalCents + booking.guestFeeCents;
  const platformFee = inv?.platformFeeCents ?? pay?.platformFeeCents ?? null;
  const hostPayout = inv?.hostPayoutCents ?? pay?.hostPayoutCents ?? null;
  const paymentStatus = pay?.status ?? inv?.paymentStatus ?? "PENDING";
  const dateSrc = inv?.issuedAt ?? pay?.updatedAt ?? booking.updatedAt;
  const code = booking.confirmationCode ?? inv?.confirmationCode ?? null;
  const invoiceNumber =
    code != null && code.length > 0 ? `INV-${code.replace(/[^A-Z0-9]/gi, "")}` : `INV-B-${booking.id.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  return {
    bookingId: booking.id,
    confirmationCode: code,
    guestName: inv?.guestNameSnapshot ?? booking.guest.name ?? null,
    listingTitle: inv?.listingTitleSnapshot ?? booking.listing.title,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: booking.nights,
    totalAmountCents: total,
    platformFeeCents: platformFee,
    hostPayoutCents: hostPayout,
    paymentStatus,
    date: dateSrc.toISOString(),
    stripeSessionId: inv?.stripeSessionId ?? pay?.stripeCheckoutSessionId ?? null,
    paymentIntentId: inv?.paymentIntentId ?? pay?.stripePaymentId ?? null,
    invoiceNumber,
  };
}
