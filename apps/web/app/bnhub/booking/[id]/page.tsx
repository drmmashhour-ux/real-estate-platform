import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CONTRACT_TYPES } from "@/lib/hubs/contract-types";
import { GenerateLeaseButton } from "@/components/contracts/GenerateLeaseButton";
import { isStripeConfigured } from "@/lib/stripe";
import { TrustStrip } from "@/components/ui/TrustStrip";
import { getBrokerPhoneDisplay, getBrokerTelHref } from "@/lib/config/contact";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";
import { BookingPayButton } from "./booking-pay-button";
import { HostBookingActions } from "./host-booking-actions";
import { GuestBookingActions } from "./guest-booking-actions";
import { CopyCodeButton, PostPaymentPoll } from "./booking-confirmation-ux";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import { getGuaranteesForBooking } from "@/lib/bnhub/bnhub-guarantee";
import { GuaranteeClaimButton } from "@/components/bnhub/GuaranteeClaimButton";
import { ServiceRequestPanel } from "@/components/bnhub/services/ServiceRequestPanel";

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid: paidParam } = await searchParams;
  const [booking, guestId, guarantees] = await Promise.all([
    getBookingById(id),
    getGuestId(),
    getGuaranteesForBooking(id),
  ]);
  if (!booking) notFound();

  const activeBnGuarantee = guarantees.find((g) => g.status === "ACTIVE");

  const leaseContract = await prisma.contract.findFirst({
    where: { bookingId: id, type: CONTRACT_TYPES.LEASE },
    select: { id: true },
  });
  const showLeaseCta = booking.status === "CONFIRMED" || booking.status === "COMPLETED";

  const totalCharged =
    booking.payment?.stripeCheckoutAmountCents ??
    booking.payment?.amountCents ??
    booking.totalCents + booking.guestFeeCents;
  const isPending = booking.status === "PENDING";
  const awaitingApproval = booking.status === "AWAITING_HOST_APPROVAL";
  const isHost = guestId === booking.listing.ownerId;
  const isGuest = guestId === booking.guestId;
  const showGuestGuaranteeClaim =
    isGuest &&
    Boolean(activeBnGuarantee) &&
    (booking.status === "CONFIRMED" || booking.status === "COMPLETED");
  const canPay = isPending && isGuest;
  const canApproveOrDecline = awaitingApproval && isHost;
  const receiptUrl = booking.payment?.stripeReceiptUrl;
  const canDownloadBnhubInvoice = Boolean(
    booking.payment?.status === "COMPLETED" &&
      (booking.status === "CONFIRMED" || booking.status === "COMPLETED")
  );
  const showStripeReceipt = Boolean(receiptUrl && canDownloadBnhubInvoice);
  const showPaidConfirmation = Boolean(canDownloadBnhubInvoice && booking.confirmationCode);

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

  const pollAfterStripe =
    isGuest &&
    paidParam === "1" &&
    !(
      booking.payment?.status === "COMPLETED" &&
      (booking.status === "CONFIRMED" || booking.status === "COMPLETED")
    );

  const messagesLink = `/messages?host=${booking.listing.ownerId}&listing=${booking.listingId}`;

  const bookingDecision = await safeEvaluateDecision({
    hub: "bnhub",
    userId: guestId ?? "anonymous",
    userRole: isHost ? "HOST" : isGuest ? "GUEST" : "USER",
    entityType: "booking",
    entityId: id,
    skipLog: !guestId,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <PostPaymentPoll bookingId={id} enabled={pollAfterStripe} />

      <div className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <DecisionCard
            title={isHost ? "Host — booking risk & guest summary" : "Guest — booking risk & fees"}
            result={bookingDecision}
            actionHref={`/bnhub/${booking.listingId}`}
            actionLabel="View listing"
          />
        </div>
      </div>

      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/90">
            {isHost ? "Reservation" : "Booking"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {showPaidConfirmation ? "Booking confirmed" : statusMessage}
          </h1>

          {showPaidConfirmation ? (
            <div className="mt-6 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-950/40 to-slate-900/60 p-6 shadow-lg shadow-amber-900/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                Confirmation code
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-amber-100 sm:text-3xl">
                {booking.confirmationCode}
              </p>
              <CopyCodeButton code={booking.confirmationCode!} />
              <div className="mt-6 space-y-1 border-t border-amber-500/20 pt-6 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">Listing · </span>
                  <span className="font-medium text-white">{booking.listing.title}</span>
                </p>
                <p>
                  <span className="text-slate-500">Dates · </span>
                  {new Date(booking.checkIn).toLocaleDateString()} –{" "}
                  {new Date(booking.checkOut).toLocaleDateString()}
                </p>
                <p className="text-lg font-semibold text-emerald-300">
                  Total paid · ${(totalCharged / 100).toFixed(2)}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={`/api/booking/${id}/invoice/pdf`}
                  className="inline-flex justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  Download invoice (PDF)
                </a>
                <Link
                  href={`/bnhub/booking/${id}#details`}
                  className="inline-flex justify-center rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-slate-800"
                >
                  View booking details
                </Link>
                <Link
                  href={messagesLink}
                  className="inline-flex justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
                >
                  Contact host
                </Link>
                {showStripeReceipt && receiptUrl ? (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center rounded-xl border border-slate-500 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    View payment receipt
                  </a>
                ) : null}
              </div>
              {pollAfterStripe ? (
                <p className="mt-4 text-xs text-amber-200/80">
                  Finalizing your payment… This page updates automatically when your booking is confirmed.
                </p>
              ) : null}
              <div className="mt-6 space-y-2 text-sm text-slate-300">
                <p>
                  Need help?{" "}
                  <a
                    href={getPhoneTelLink()}
                    className="font-semibold text-amber-300 underline-offset-2 hover:text-amber-200 hover:underline"
                  >
                    Call us: {getPhoneNumber()}
                  </a>
                </p>
                <p>
                  For real estate services:{" "}
                  <a
                    href={getBrokerTelHref()}
                    className="font-semibold text-amber-300 underline-offset-2 hover:text-amber-200 hover:underline"
                  >
                    Call Mohamed: {getBrokerPhoneDisplay()}
                  </a>
                </p>
              </div>
            </div>
          ) : booking.confirmationCode ? (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                Confirmation code
              </p>
              <p className="mt-1 font-mono text-lg font-bold tracking-wide text-amber-100">
                {booking.confirmationCode}
              </p>
              <CopyCodeButton code={booking.confirmationCode} />
            </div>
          ) : null}

          {!showPaidConfirmation ? (
            <>
              <p className="mt-4 text-sm text-slate-400">
                {booking.listing.title} · {new Date(booking.checkIn).toLocaleDateString()} –{" "}
                {new Date(booking.checkOut).toLocaleDateString()}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">Listing ID {booking.listing.listingCode}</p>
            </>
          ) : null}
        </div>
      </section>

      <section className="bg-slate-950/90" id="details">
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
            {booking.bnhubBookingServices && booking.bnhubBookingServices.length > 0 ? (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="text-sm font-medium text-slate-400">Add-ons on this reservation</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {booking.bnhubBookingServices.map((s) => (
                    <li key={s.id} className="flex flex-wrap justify-between gap-2">
                      <span>
                        {s.service.name} × {s.quantity}{" "}
                        <span className="text-xs text-slate-500">({s.status.toLowerCase()})</span>
                      </span>
                      <span className="text-emerald-200/90">${(s.totalPriceCents / 100).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-4 text-sm text-slate-400">
              {isPending || awaitingApproval ? "Total" : "Total charged"}
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">
              ${(totalCharged / 100).toFixed(2)}
            </p>
            {canApproveOrDecline && (
              <HostBookingActions bookingId={id} className="mt-6 flex flex-wrap gap-3" />
            )}
            {showGuestGuaranteeClaim ? <GuaranteeClaimButton bookingId={id} /> : null}
            {canPay && (
              <div className="mt-6 flex flex-wrap gap-3">
                <BookingPayButton
                  bookingId={id}
                  amountCents={
                    booking.payment?.amountCents ?? booking.totalCents + booking.guestFeeCents
                  }
                  stripeConfigured={isStripeConfigured()}
                />
              </div>
            )}
            {canDownloadBnhubInvoice && !showPaidConfirmation ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={`/api/booking/${id}/invoice/pdf`}
                  className="inline-flex justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  Download invoice (PDF)
                </a>
                <a
                  href={`/api/booking/${id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Invoice data (JSON)
                </a>
                {showStripeReceipt && receiptUrl ? (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    View payment receipt
                  </a>
                ) : null}
              </div>
            ) : null}
            {canDownloadBnhubInvoice && !showPaidConfirmation ? (
              <p className="mt-2 text-xs text-slate-500">
                PDF includes confirmation code and amount breakdown. JSON is for your records or integrations.
              </p>
            ) : null}
            {isGuest && canDownloadBnhubInvoice ? (
              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Emails: </span>
                Confirmation{" "}
                {booking.guestConfirmationEmailSentAt ? (
                  <span className="text-emerald-400">sent</span>
                ) : (
                  <span className="text-slate-500">pending / not configured</span>
                )}
                {" · "}
                Receipt / invoice{" "}
                {booking.guestInvoiceEmailSentAt ? (
                  <span className="text-emerald-400">sent</span>
                ) : (
                  <span className="text-slate-500">pending / not configured</span>
                )}
              </p>
            ) : null}
            {showLeaseCta && (isGuest || isHost) ? (
              <GenerateLeaseButton
                listingId={booking.listingId}
                bookingId={id}
                existingContractId={leaseContract?.id ?? null}
              />
            ) : null}
            {isHost && canDownloadBnhubInvoice && booking.payment ? (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payout summary</p>
                <p className="mt-1">
                  Your estimated payout:{" "}
                  <span className="font-semibold text-emerald-300">
                    ${((booking.payment.hostPayoutCents ?? 0) / 100).toFixed(2)}
                  </span>
                </p>
                <p className="mt-1">
                  Platform commission:{" "}
                  <span className="text-amber-200/90">
                    ${((booking.payment.platformFeeCents ?? 0) / 100).toFixed(2)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Settled via Stripe Connect; timing follows your Stripe account.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Host alert email:{" "}
                  {booking.hostBookingAlertEmailSentAt ? (
                    <span className="text-emerald-400">sent</span>
                  ) : (
                    <span className="text-slate-500">pending / not configured</span>
                  )}
                </p>
              </div>
            ) : null}
            {isGuest && !canPay && !awaitingApproval && (
              <GuestBookingActions bookingId={id} className="mt-6 flex flex-wrap gap-3" />
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {isGuest && (
                <Link
                  href={`/bnhub/booking/${id}/report-issue`}
                  className="rounded-xl border border-rose-600/60 px-4 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-900/30"
                >
                  Report an issue
                </Link>
              )}
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
                href="/bnhub/stays"
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
          {isGuest && !["DECLINED", "CANCELLED"].includes(booking.status) ? (
            <div className="mt-6">
              <ServiceRequestPanel
                bookingId={id}
                listingId={booking.listingId}
                canRequest
              />
            </div>
          ) : null}
          <div className="mt-6">
            <TrustStrip audience="stays" />
          </div>
        </div>
      </section>
    </main>
  );
}
