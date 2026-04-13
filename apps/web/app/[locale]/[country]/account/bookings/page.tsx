import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";
import { AccountBookingsTabs, type AccountBookingCard } from "./AccountBookingsTabs";

export const dynamic = "force-dynamic";

const TERMINAL_CANCEL = new Set([
  "CANCELLED",
  "CANCELLED_BY_GUEST",
  "CANCELLED_BY_HOST",
  "DECLINED",
  "EXPIRED",
]);

function coverUrl(b: {
  listing: { listingPhotos: { url: string }[]; photos: unknown };
}): string | null {
  const p = b.listing.listingPhotos[0]?.url;
  if (p) return p;
  const raw = b.listing.photos;
  return Array.isArray(raw) && typeof raw[0] === "string" ? raw[0] : null;
}

function toCard(
  b: {
    id: string;
    status: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    guestsCount: number | null;
    listing: { title: string; listingPhotos: { url: string }[]; photos: unknown };
    payment: { amountCents: number | null; status: string } | null;
  },
  now: Date
): AccountBookingCard {
  const total =
    b.payment?.amountCents != null
      ? (b.payment.amountCents / 100).toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })
      : "—";
  const paid = b.payment?.status === PaymentStatus.COMPLETED;
  const canCancelGuest =
    (b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "AWAITING_HOST_APPROVAL") &&
    b.checkIn > now;

  return {
    id: b.id,
    status: b.status,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    guestsCount: b.guestsCount,
    title: b.listing.title,
    imageUrl: coverUrl(b),
    totalLabel: total,
    paidLabel: paid ? "· Paid" : "",
    canCancelGuest,
  };
}

export default async function AccountBookingsPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/account/bookings");

  const now = new Date();
  const rows = await prisma.booking.findMany({
    where: { guestId: userId },
    orderBy: { checkIn: "desc" },
    take: 120,
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guestsCount: true,
      listing: {
        select: {
          id: true,
          title: true,
          listingPhotos: { take: 1, select: { url: true } },
          photos: true,
        },
      },
      payment: { select: { amountCents: true, status: true } },
    },
  });

  const upcomingRows = rows.filter((b) => b.checkOut >= now && !TERMINAL_CANCEL.has(b.status));
  const pastRows = rows.filter((b) => b.checkOut < now && !TERMINAL_CANCEL.has(b.status));
  const canceledRows = rows.filter((b) => TERMINAL_CANCEL.has(b.status));

  const upcoming = upcomingRows.map((b) => toCard(b, now));
  const past = pastRows.map((b) => toCard(b, now));
  const canceled = canceledRows.map((b) => toCard(b, now));

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 text-slate-900">
      <h1 className="text-2xl font-bold">My bookings</h1>
      <p className="mt-1 text-sm text-slate-600">Stays you&apos;ve booked on LECIPM.</p>
      <p className="mt-3 text-sm">
        <Link href="/account/saved" className="font-medium text-sky-700 hover:underline">
          Saved stays
        </Link>
        <span className="mx-2 text-slate-400">·</span>
        <Link href="/bnhub/stays" className="text-slate-600 hover:underline">
          Find more stays
        </Link>
      </p>

      <AccountBookingsTabs upcoming={upcoming} past={past} canceled={canceled} />
    </main>
  );
}
