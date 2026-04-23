import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getGuestPaymentSummary } from "@/modules/bnhub-payments/services/paymentService";
import { getRefundSummary } from "@/modules/bnhub-payments/services/refundService";

function getPaymentTimeline(status: string | null | undefined) {
  if (status === "PAID") {
    return {
      headline: "Payment confirmed",
      detail: "Your payment was captured and the booking can move into its confirmed stay flow.",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    };
  }
  if (status === "PROCESSING") {
    return {
      headline: "Finalizing payment",
      detail: "Checkout succeeded and the platform is waiting for Stripe webhook confirmation.",
      tone: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    };
  }
  if (status === "REQUIRES_ACTION") {
    return {
      headline: "Payment action needed",
      detail: "Your booking is not confirmed until checkout is completed.",
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    };
  }
  if (status === "FAILED") {
    return {
      headline: "Payment failed",
      detail: "Try checkout again or contact support if money left your card.",
      tone: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    };
  }
  return {
    headline: "Payment details pending",
    detail: "This page will update as soon as checkout creates or updates the payment record.",
    tone: "border-slate-700 bg-slate-900/40 text-slate-300",
  };
}

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
  const timeline = getPaymentTimeline(mp?.paymentStatus ?? booking.payment?.status);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <Link href="/guest/payments" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← All payments
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{booking.listing.title}</h1>
        <p className="mt-1 text-sm text-slate-400">Confirmation {booking.confirmationCode ?? "—"}</p>
        <section className={`mt-6 rounded-xl border p-4 ${timeline.tone}`}>
          <p className="text-sm font-semibold">{timeline.headline}</p>
          <p className="mt-1 text-sm opacity-90">{timeline.detail}</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <p>1. Checkout created</p>
            <p>2. Payment confirmed by Stripe</p>
            <p>3. Receipt and booking confirmation available</p>
          </div>
        </section>

        <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-500/80" strokeWidth={2} aria-hidden />
          <span>Charges and receipts run through Stripe — your card never passes through LECIPM servers.</span>
        </p>

        <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
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
            {mp?.paidAt ? (
              <p className="text-slate-500">
                Paid at{" "}
                {mp.paidAt.toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
            {mp?.amountCapturedCents != null ? (
              <p className="text-slate-500">
                Captured amount {(mp.amountCapturedCents / 100).toFixed(2)} {mp.currency.toUpperCase()}
              </p>
            ) : null}
            {mp?.amountRefundedCents ? (
              <p className="text-slate-500">
                Refunded so far {(mp.amountRefundedCents / 100).toFixed(2)} {mp.currency.toUpperCase()}
              </p>
            ) : null}
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
                  {(r.amountCents / 100).toFixed(2)} {r.currency.toUpperCase()} — {r.refundStatus.toLowerCase()} (
                  {r.refundType.toLowerCase().replace(/_/g, " ")})
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
