import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { BookingPayButton } from "./booking-pay-button";
import { HostBookingActions } from "./host-booking-actions";
import { GuestBookingActions } from "./guest-booking-actions";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [booking, guestId] = await Promise.all([
    getBookingById(id),
    getGuestId(),
  ]);
  if (!booking) notFound();

  const totalCharged = booking.payment?.amountCents ?? booking.totalCents + booking.guestFeeCents;
  const isPending = booking.status === "PENDING";
  const awaitingApproval = booking.status === "AWAITING_HOST_APPROVAL";
  const isHost = guestId === booking.listing.ownerId;
  const isGuest = guestId === booking.guestId;
  const canPay = isPending && isGuest;
  const canApproveOrDecline = awaitingApproval && isHost;

  const statusMessage =
    awaitingApproval
      ? "Request sent — waiting for host to approve"
      : isPending
        ? "Pay to confirm"
        : booking.status === "CONFIRMED"
          ? "Booking confirmed"
          : booking.status === "COMPLETED"
            ? "Stay completed"
            : booking.status === "DECLINED"
              ? "Declined by host"
              : booking.status.toLowerCase().replace(/_/g, " ");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            {isHost ? "Reservation" : "Booking"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {statusMessage}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {booking.listing.title} · {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
          </p>
        </div>
      </section>

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm font-medium text-slate-400">Status</p>
            <p className="mt-1 font-semibold text-slate-100 capitalize">
              {booking.status.toLowerCase().replace(/_/g, " ")}
            </p>
            <p className="mt-4 text-sm text-slate-400">Check-in</p>
            <p className="mt-1 text-slate-100">{new Date(booking.checkIn).toLocaleDateString()}</p>
            <p className="mt-2 text-sm text-slate-400">Check-out</p>
            <p className="mt-1 text-slate-100">{new Date(booking.checkOut).toLocaleDateString()}</p>
            <p className="mt-2 text-sm text-slate-400">Nights</p>
            <p className="mt-1 text-slate-100">{booking.nights}</p>
            <p className="mt-4 text-sm text-slate-400">
              {isPending || awaitingApproval ? "Total" : "Total charged"}
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">
              ${(totalCharged / 100).toFixed(2)}
            </p>
            {canApproveOrDecline && (
              <HostBookingActions bookingId={id} className="mt-6 flex flex-wrap gap-3" />
            )}
            {canPay && (
              <div className="mt-6 flex flex-wrap gap-3">
                <BookingPayButton bookingId={id} />
              </div>
            )}
            {isGuest && !canPay && !awaitingApproval && (
              <GuestBookingActions bookingId={id} className="mt-6 flex flex-wrap gap-3" />
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/bnhub/booking/${id}/dispute`}
                className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Open dispute
              </Link>
              <Link
                href="/bnhub/trips"
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
              >
                My trips
              </Link>
              <Link
                href="/bnhub"
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Browse more stays
              </Link>
              {isHost && (
                <Link
                  href="/bnhub/host/dashboard"
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
                >
                  Host dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
