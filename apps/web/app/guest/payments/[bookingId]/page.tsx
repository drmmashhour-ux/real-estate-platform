import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getGuestPaymentSummary } from "@/modules/bnhub-payments/services/paymentService";
import { getRefundSummary } from "@/modules/bnhub-payments/services/refundService";

export default async function GuestPaymentDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const guestId = await getGuestId();
  if (!guestId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
        <Link href="/bnhub/login" className="text-emerald-400">
          Sign in
        </Link>
      </main>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      confirmationCode: true,
      listing: { select: { title: true } },
      payment: {
        select: {
          amountCents: true,
          status: true,
          stripeReceiptUrl: true,
          stripeCheckoutAmountCents: true,
        },
      },
    },
  });
  if (!booking || booking.guestId !== guestId) notFound();

  const mp = await getGuestPaymentSummary(guestId, bookingId);
  const refunds = await getRefundSummary(guestId, bookingId);
  const q = mp?.quote;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <Link href="/guest/payments" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← All payments
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{booking.listing.title}</h1>
        <p className="mt-1 text-sm text-slate-400">Confirmation {booking.confirmationCode ?? "—"}</p>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Receipt summary</h2>
          {q ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Nightly subtotal</dt>
                <dd>{(q.nightlySubtotalCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Cleaning</dt>
                <dd>{(q.cleaningFeeCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Taxes</dt>
                <dd>{(q.taxTotalCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Service fee</dt>
                <dd>{(q.serviceFeeCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Add-ons</dt>
                <dd>{(q.addOnTotalCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold">
                <dt>Total (quote)</dt>
                <dd>{(q.grandTotalCents / 100).toFixed(2)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Detailed line items appear after checkout initiates the marketplace payment record.
            </p>
          )}
          <div className="mt-4 text-sm text-slate-300">
            <p>Payment status: {mp?.paymentStatus ?? booking.payment?.status ?? "—"}</p>
            {mp?.paidAt ? <p className="text-slate-500">Paid at {mp.paidAt.toISOString()}</p> : null}
          </div>
          {booking.payment?.stripeReceiptUrl ? (
            <a
              href={booking.payment.stripeReceiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
            >
              Open Stripe receipt
            </a>
          ) : null}
        </section>

        {refunds.length > 0 ? (
          <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-semibold text-slate-400">Refunds</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {refunds.map((r) => (
                <li key={r.id}>
                  {(r.amountCents / 100).toFixed(2)} {r.currency.toUpperCase()} — {r.refundStatus} ({r.refundType})
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
