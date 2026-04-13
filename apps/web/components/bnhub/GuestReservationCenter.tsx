import Link from "next/link";

type BookingSummary = {
  id: string;
  status: string;
  checkIn: Date;
  checkOut: Date;
  listing: { title: string; city: string };
  payment: { status: string } | null;
  bnhubReservationPayment:
    | {
        paymentStatus: string;
      }
    | null;
};

type ReservationNotification = {
  id: string;
  title: string;
  message: string | null;
  actionUrl: string | null;
  createdAt: Date;
};

function daysUntil(date: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((startOfTarget - startOfToday) / (1000 * 60 * 60 * 24));
}

function bookingTone(status: string) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "text-emerald-300";
  if (status === "PENDING" || status === "AWAITING_HOST_APPROVAL") return "text-amber-300";
  if (status === "DECLINED" || status === "CANCELLED") return "text-rose-300";
  return "text-slate-300";
}

function paymentLabel(booking: BookingSummary) {
  const paymentStatus = booking.bnhubReservationPayment?.paymentStatus;
  if (paymentStatus === "PAID") return "Payment confirmed";
  if (paymentStatus === "PROCESSING") return "Payment processing";
  if (paymentStatus === "REQUIRES_ACTION") return "Payment action needed";
  if (paymentStatus === "FAILED") return "Payment failed";
  if (booking.payment?.status === "COMPLETED") return "Payment confirmed";
  if (booking.payment?.status === "PENDING") return "Awaiting payment";
  return "No payment update yet";
}

export function GuestReservationCenter({
  bookings,
  notifications,
}: {
  bookings: BookingSummary[];
  notifications: ReservationNotification[];
}) {
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING" || b.status === "AWAITING_HOST_APPROVAL").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const actionNeeded = bookings.filter((b) => {
    const p = b.bnhubReservationPayment?.paymentStatus;
    return b.status === "PENDING" || b.status === "AWAITING_HOST_APPROVAL" || p === "REQUIRES_ACTION" || p === "FAILED";
  }).length;
  const nextBooking = bookings
    .filter((b) => b.status !== "CANCELLED" && b.status !== "DECLINED")
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())[0];
  const nextCheckInDays = nextBooking ? daysUntil(nextBooking.checkIn) : null;
  const nextCheckOutDays = nextBooking ? daysUntil(nextBooking.checkOut) : null;
  const reminderCards = nextBooking
    ? [
        {
          title: "Check-in countdown",
          tone: "text-amber-300",
          body:
            nextCheckInDays != null && nextCheckInDays > 1
              ? `${nextCheckInDays} days until check-in for ${nextBooking.listing.title}.`
              : nextCheckInDays === 1
                ? `Check-in is tomorrow for ${nextBooking.listing.title}.`
                : nextCheckInDays === 0
                  ? `Check-in is today for ${nextBooking.listing.title}.`
                  : "Check-in date has passed. Review your booking timeline for latest status.",
        },
        {
          title: "Check-out reminder",
          tone: "text-sky-300",
          body:
            nextCheckOutDays != null && nextCheckOutDays > 1
              ? `${nextCheckOutDays} days until check-out. Keep your booking details handy in the app.`
              : nextCheckOutDays === 1
                ? "Check-out is tomorrow. Review timing, host instructions, and payment details."
                : nextCheckOutDays === 0
                  ? "Check-out is today. Confirm departure steps and any final host messages."
                  : "Your next active stay has ended or is in completion review.",
        },
      ]
    : [];

  return (
    <section className="rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top,#1f1908,transparent_36%),linear-gradient(180deg,#0d0d0d,#121212)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Guest reservation center</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Follow bookings, confirmations, and travel updates in one place.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            This is the mobile-first BNHUB guest control layer for reservation progress, payment confirmation, and latest notifications.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/bnhub/notifications" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:border-premium-gold/40 hover:bg-white/5">
            Guest notifications
          </Link>
          <Link href="/dashboard/notifications" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:border-premium-gold/40 hover:bg-white/5">
            Open notifications
          </Link>
          <Link href="/bnhub/stays" className="rounded-full bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:brightness-110">
            Book another stay
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming trips</p>
          <p className="mt-2 text-3xl font-semibold text-white">{upcoming}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Confirmed stays</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{confirmed}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Action needed</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{actionNeeded}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Next check-in</p>
          <p className="mt-2 text-lg font-semibold text-white">
            {nextBooking ? nextBooking.checkIn.toLocaleDateString() : "No active trip"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{nextBooking ? nextBooking.listing.title : "Search a stay to get started"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Stay reminders</h3>
            {nextBooking ? (
              <Link href={`/bnhub/booking/${nextBooking.id}`} className="text-xs text-slate-400 hover:text-white">
                Open next booking →
              </Link>
            ) : null}
          </div>
          {reminderCards.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No active stay reminders yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {reminderCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-[#0d1117] p-4">
                  <p className={`text-sm font-semibold ${card.tone}`}>{card.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-premium-gold/15 bg-premium-gold/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Phone app direction</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Reservation confirmations should appear here like a mobile inbox, with one-tap access to booking details.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Next step: push-style reminders for payment confirmation, host approval, check-in, check-out, and review requests.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              Then convert this into an installable guest app flow with reservation center, notifications, and travel timeline.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Reservation snapshot</h3>
            <Link href="/bnhub/stays" className="text-xs text-slate-400 hover:text-white">
              Search stays →
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No reservations yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {bookings.slice(0, 4).map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-white/10 bg-[#0d1117] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{booking.listing.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {booking.listing.city} · {booking.checkIn.toLocaleDateString()} - {booking.checkOut.toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${bookingTone(booking.status)}`}>{booking.status.replace(/_/g, " ")}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{paymentLabel(booking)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/bnhub/booking/${booking.id}`} className="rounded-full border border-premium-gold/35 px-3 py-1.5 text-xs font-semibold text-premium-gold hover:bg-premium-gold/10">
                      Open reservation
                    </Link>
                    <Link href={`/guest/payments/${booking.id}`} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/5">
                      Payment details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-premium-gold">Latest alerts</h3>
            <Link href="/dashboard/notifications" className="text-xs text-slate-400 hover:text-white">
              View all →
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No recent reservation alerts.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-white/10 bg-[#0d1117] p-4">
                  <p className="text-sm font-semibold text-white">{notification.title}</p>
                  {notification.message ? <p className="mt-2 text-sm text-slate-400">{notification.message}</p> : null}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">{notification.createdAt.toLocaleString()}</p>
                    {notification.actionUrl ? (
                      <Link href={notification.actionUrl} className="text-xs font-semibold text-premium-gold hover:underline">
                        Open →
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-premium-gold/15 bg-premium-gold/5 p-4">
            <p className="text-sm font-semibold text-premium-gold">Mobile app direction</p>
            <p className="mt-2 text-sm text-slate-400">
              Next step: turn this guest center into a phone-first app flow with push notifications for confirmation, payment, and check-in reminders.
            </p>
            <Link href="/bnhub/notifications" className="mt-3 inline-block text-sm font-semibold text-premium-gold hover:underline">
              Open guest notification timeline →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
