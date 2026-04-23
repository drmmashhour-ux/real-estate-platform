import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

function getPaymentTimelineLabel(paymentStatus: string | null | undefined, legacyStatus: string | null | undefined) {
  if (paymentStatus === "PAID") return { label: "Payment confirmed", tone: "text-emerald-300" };
  if (paymentStatus === "PROCESSING") return { label: "Processing after checkout", tone: "text-sky-300" };
  if (paymentStatus === "REQUIRES_ACTION") return { label: "Action needed to complete payment", tone: "text-amber-300" };
  if (paymentStatus === "FAILED") return { label: "Payment failed", tone: "text-rose-300" };
  if (legacyStatus === "COMPLETED") return { label: "Payment confirmed", tone: "text-emerald-300" };
  if (legacyStatus === "PENDING") return { label: "Not paid yet", tone: "text-amber-300" };
  return { label: "Payment status unavailable", tone: "text-slate-400" };
}

export default async function GuestPaymentsPage() {
  const guestId = await getGuestId();
  if (!guestId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <p className="text-slate-400">Sign in to view payments.</p>
        <Link href="/bnhub/login" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300">
          Sign in
        </Link>
      </main>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { guestId },
    include: {
      listing: { select: { id: true, title: true, city: true } },
      payment: { select: { amountCents: true, status: true } },
      bnhubReservationPayment: {
        select: { paymentStatus: true, amountCapturedCents: true, currency: true },
      },
    },
    orderBy: { checkIn: "desc" },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/bnhub/trips" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Trips
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Payments & receipts</h1>
        <p className="mt-2 text-sm text-slate-400">
          Authoritative totals are computed on the server when you pay. Payout timing to hosts follows platform
          policy (delayed release / payout control — not legal escrow unless separately contracted).
        </p>
        <ul className="mt-8 space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              {(() => {
                const timeline = getPaymentTimelineLabel(
                  b.bnhubReservationPayment?.paymentStatus,
                  b.payment?.status
                );
                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{b.listing.title}</p>
                        <p className="text-xs text-slate-500">
                          {b.listing.city ?? "—"} ·{" "}
                          {b.payment ? `${(b.payment.amountCents / 100).toFixed(2)} charged` : "No payment row"}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className={timeline.tone}>{timeline.label}</p>
                        <p className="text-xs text-slate-500">
                          Checkout: {b.bnhubReservationPayment?.paymentStatus ?? "not started"} · Booking:{" "}
                          {b.payment?.status?.toLowerCase() ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                      {b.bnhubReservationPayment?.paymentStatus === "PROCESSING"
                        ? "Your checkout finished, and the platform is waiting for payment confirmation from Stripe."
                        : b.bnhubReservationPayment?.paymentStatus === "REQUIRES_ACTION"
                          ? "Open this payment to continue checkout and confirm the booking."
                          : b.bnhubReservationPayment?.paymentStatus === "PAID"
                            ? "Receipt and final breakdown are available."
                            : b.bnhubReservationPayment?.paymentStatus === "FAILED"
                              ? "Try checkout again or contact support if money left your card."
                              : "Open the payment detail page to see the latest booking and receipt status."}
                    </div>
                  </>
                );
              })()}
              <Link
                href={`/guest/payments/${b.id}`}
                className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                View breakdown
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
