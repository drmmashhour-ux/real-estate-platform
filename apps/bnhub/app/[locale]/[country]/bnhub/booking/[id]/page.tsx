import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { CONTRACT_TYPES } from "@/lib/hubs/contract-types";
import { GenerateLeaseButton } from "@/components/contracts/GenerateLeaseButton";
import { isStripeConfigured } from "@/lib/stripe";
import { BnhubTrustSignals } from "@/components/bnhub/BnhubTrustSignals";
import { TrustStrip } from "@/components/ui/TrustStrip";
import { getBrokerPhoneDisplay, getBrokerTelHref } from "@/lib/config/contact";
import { getPhoneNumber, getPhoneTelLink } from "@/lib/phone";
import { BookingPayButton } from "./booking-pay-button";
import { HostBookingActions } from "./host-booking-actions";
import { HostManualPaymentActions } from "./host-manual-payment-actions";
import { GuestBookingActions } from "./guest-booking-actions";
import { CopyCodeButton, PostPaymentPoll } from "./booking-confirmation-ux";
import { DecisionCard } from "@/components/ai/DecisionCard";
import { safeEvaluateDecision } from "@/modules/ai/decision-engine";
import { getGuaranteesForBooking } from "@/lib/bnhub/bnhub-guarantee";
import { GuaranteeClaimButton } from "@/components/bnhub/GuaranteeClaimButton";
import { ServiceRequestPanel } from "@/components/bnhub/services/ServiceRequestPanel";
import { ViralMomentPrompt } from "@/components/referral/ViralMomentPrompt";
import { BnhubBookingInsuranceSection } from "@/components/insurance/BnhubBookingInsuranceSection";
import { BookingShareMyStayBundle } from "./booking-share-my-stay-bundle";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { getResolvedMarket } from "@/lib/markets";
import { resolveInitialLocale } from "@/lib/i18n/resolve-initial-locale";
import { translateServer } from "@/lib/i18n/server-translate";
import { getBookingAIDecisionMessage } from "@/lib/bnhub/booking-ai-insight";
import { BookingAIInsight } from "@/components/bnhub/BookingAIInsight";

function formatEventLabel(eventType: string) {
  switch (eventType) {
    case "created":
      return "Booking created";
    case "awaiting_host_approval":
      return "Waiting for host approval";
    case "approved":
      return "Approved by host";
    case "confirmed":
      return "Payment confirmed";
    case "completed":
      return "Stay completed";
    case "cancelled":
      return "Booking cancelled";
    case "declined":
      return "Declined by host";
    default:
      return eventType.replace(/_/g, " ");
  }
}

function buildTimelineSteps(params: {
  bookingStatus: string;
  paymentStatus: string | null;
  paymentLegacyStatus: string | null;
  eventTypes: string[];
}) {
  const { bookingStatus, paymentStatus, paymentLegacyStatus, eventTypes } = params;
  const createdDone = eventTypes.includes("created") || eventTypes.includes("awaiting_host_approval");
  const hostApprovedDone =
    bookingStatus !== "AWAITING_HOST_APPROVAL" &&
    bookingStatus !== "DECLINED" &&
    (eventTypes.includes("approved") || bookingStatus !== "PENDING");
  const paymentDone = paymentStatus === "PAID" || paymentLegacyStatus === "COMPLETED";
  const stayDone = bookingStatus === "COMPLETED" || eventTypes.includes("completed");

  const hostApprovalState =
    bookingStatus === "DECLINED"
      ? "failed"
      : bookingStatus === "AWAITING_HOST_APPROVAL"
        ? "current"
        : hostApprovedDone
          ? "done"
          : "upcoming";
  const paymentState =
    paymentStatus === "FAILED"
      ? "failed"
      : paymentDone
        ? "done"
        : paymentStatus === "PROCESSING" || paymentStatus === "REQUIRES_ACTION" || bookingStatus === "PENDING"
          ? "current"
          : bookingStatus === "CONFIRMED" || bookingStatus === "COMPLETED"
            ? "done"
            : "upcoming";
  const stayState =
    bookingStatus === "CANCELLED" || bookingStatus === "DECLINED"
      ? "upcoming"
      : stayDone
        ? "done"
        : bookingStatus === "CONFIRMED"
          ? "current"
          : "upcoming";

  return [
    {
      key: "request",
      label: "Request sent",
      state: createdDone ? "done" : "current",
      description: "The reservation was created and is now tracked on BNHUB.",
    },
    {
      key: "approval",
      label: "Host approval",
      state: hostApprovalState,
      description:
        bookingStatus === "AWAITING_HOST_APPROVAL"
          ? "The host still needs to approve this stay."
          : bookingStatus === "DECLINED"
            ? "The host declined this booking."
            : "Approval requirements are complete.",
    },
    {
      key: "payment",
      label: "Payment",
      state: paymentState,
      description:
        paymentStatus === "PROCESSING"
          ? "Checkout finished and payment confirmation is still processing."
          : paymentStatus === "REQUIRES_ACTION"
            ? "The guest still needs to finish checkout."
            : paymentStatus === "FAILED"
              ? "Payment failed and needs attention."
              : paymentDone
                ? "Payment was captured successfully."
                : "Payment details will appear here.",
    },
    {
      key: "stay",
      label: "Stay complete",
      state: stayState,
      description:
        bookingStatus === "COMPLETED"
          ? "The reservation has been completed."
          : bookingStatus === "CONFIRMED"
            ? "The booking is confirmed and ready for the stay."
            : "This step completes after checkout and the stay itself.",
    },
  ];
}

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid: paidParam } = (await searchParams) ?? {};
  const booking = await getBookingById(id);
  const market = await getResolvedMarket();
  const pageLocale = await resolveInitialLocale(await cookies());
  const guestId = await getGuestId();
  const guarantees = await getGuaranteesForBooking(id);
  const bookingEvents = await prisma.bnhubBookingEvent.findMany({
    where: { bookingId: id },
    select: { id: true, eventType: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  if (!booking) notFound();
  if (!guestId) {
    redirect(`/bnhub/login?next=${encodeURIComponent(`/bnhub/booking/${id}`)}`);
  }

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
  if (!isHost && !isGuest) {
    notFound();
  }
  const showGuestGuaranteeClaim =
    isGuest &&
    Boolean(activeBnGuarantee) &&
    (booking.status === "CONFIRMED" || booking.status === "COMPLETED");
  const canPay = isPending && isGuest;
  const showManualGuestSettlement =
    isGuest && isPending && booking.manualPaymentSettlement === "PENDING";
  const canApproveOrDecline = awaitingApproval && isHost;
  const receiptUrl = booking.payment?.stripeReceiptUrl;
  const canDownloadBnhubInvoice = Boolean(
    booking.payment?.status === "COMPLETED" &&
      (booking.status === "CONFIRMED" || booking.status === "COMPLETED")
  );
  const showStripeReceipt = Boolean(receiptUrl && canDownloadBnhubInvoice);
  const showPaidConfirmation = Boolean(canDownloadBnhubInvoice && booking.confirmationCode);
  const showShareMyStay =
    isGuest && (booking.status === "CONFIRMED" || booking.status === "COMPLETED");
  const showOnlineCheckoutBlock =
    canPay && !showPaidConfirmation && !showManualGuestSettlement && market.onlinePaymentsEnabled;
  const marketplacePaymentStatus = booking.bnhubReservationPayment?.paymentStatus ?? null;
  const eventTypes = bookingEvents.map((event) => event.eventType);
  const paymentProgressMessage =
    marketplacePaymentStatus === "PAID"
      ? "Payment captured and booking confirmed"
      : marketplacePaymentStatus === "PROCESSING"
        ? "Checkout received. We are finalizing payment confirmation."
        : marketplacePaymentStatus === "REQUIRES_ACTION"
          ? "Payment action required to confirm this booking"
          : marketplacePaymentStatus === "FAILED"
            ? "Payment failed. Try checkout again or contact support."
            : booking.payment?.status === "COMPLETED"
              ? "Payment captured"
              : booking.payment?.status === "PENDING"
                ? "Payment not completed yet"
                : "Payment details will appear here";
  const timelineSteps = buildTimelineSteps({
    bookingStatus: booking.status,
    paymentStatus: marketplacePaymentStatus,
    paymentLegacyStatus: booking.payment?.status ?? null,
    eventTypes,
  });

  const statusMessage =
    awaitingApproval
      ? "Request sent — waiting for host to approve"
      : isPending
        ? "Secure your booking"
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

  const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  const bookingAIDecisionMessage = getBookingAIDecisionMessage({
    bookingStatus: booking.status,
    checkIn: booking.checkIn,
    nights: booking.nights,
  });

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
          <div className="mt-6">
            <AIAssistantPanel
              context={{
                bookingId: id,
                listingId: booking.listingId,
                role: isHost ? "HOST" : isGuest ? "USER" : undefined,
              }}
            />
          </div>
        </div>
      </div>

      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {market.code === "syria" ? (
            <p className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {translateServer(pageLocale, "market.syriaRibbon")}
            </p>
          ) : null}
          {market.contactFirstEmphasis && market.code !== "syria" ? (
            <p className="mb-4 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              {translateServer(pageLocale, "market.contactFirstBanner")}
            </p>
          ) : null}
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400/90">
            {isHost ? "Reservation" : "Booking"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {showPaidConfirmation ? "Booking confirmed" : statusMessage}
          </h1>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Booking progress</p>
                <p className="mt-1 text-xs text-slate-500">
                  Shared guest and host timeline for request, payment, confirmation, and completion.
                </p>
              </div>
              <p className="text-xs font-medium text-emerald-300">{paymentProgressMessage}</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {timelineSteps.map((step, index) => (
                <div
                  key={step.key}
                  className={`rounded-xl border p-4 ${
                    step.state === "done"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : step.state === "current"
                        ? "border-sky-500/30 bg-sky-500/10"
                        : step.state === "failed"
                          ? "border-rose-500/30 bg-rose-500/10"
                          : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        step.state === "done"
                          ? "bg-emerald-500 text-slate-950"
                          : step.state === "current"
                            ? "bg-sky-500 text-slate-950"
                            : step.state === "failed"
                              ? "bg-rose-500 text-white"
                              : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-100">{step.label}</p>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
            {bookingEvents.length > 0 ? (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity log</p>
                <div className="mt-3 grid gap-2">
                  {bookingEvents.slice(-6).map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs"
                    >
                      <span className="text-slate-300">{formatEventLabel(event.eventType)}</span>
                      <span className="text-slate-500">
                        {event.createdAt.toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

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
              {isGuest && guestId ? (
                <div className="mt-8">
                  <ViralMomentPrompt
                    compact
                    headline="Grow LECIPM with us — invite a friend."
                    sub="First 1000 guests: share your link. When friends sign up and book, you both earn referral rewards plus visibility boosts for active sharers."
                    inviteUrl={`${appBase}/invite?ref=${encodeURIComponent(guestId)}`}
                  />
                </div>
              ) : null}
              {showPaidConfirmation && isGuest ? (
                <div className="mt-8">
                  <BnhubBookingInsuranceSection
                    bookingId={id}
                    listingId={booking.listing.id}
                    isGuest={isGuest}
                  />
                </div>
              ) : null}
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

          {showManualGuestSettlement ? (
            <div className="mt-6 rounded-2xl border border-sky-500/35 bg-slate-900/70 p-5 shadow-inner shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-300/90">
                {translateServer(pageLocale, "bookings.manualPaymentTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {translateServer(pageLocale, "bookings.manualPaymentBody")}
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                ${(totalCharged / 100).toFixed(2)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={messagesLink}
                  className="inline-flex rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-sky-400"
                >
                  {translateServer(pageLocale, "bookings.contactHost")}
                </Link>
              </div>
            </div>
          ) : null}
          {showOnlineCheckoutBlock ? (
            <div className="mt-6 rounded-2xl border border-amber-500/35 bg-slate-900/70 p-6 shadow-inner shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">
                {translateServer(pageLocale, "bookings.oneStepToConfirm")}
              </p>

              <div className="mt-4 space-y-4">
                <div
                  className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 shadow-inner shadow-black/20"
                  aria-label="Price breakdown"
                >
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-slate-500">Stay subtotal</span>
                      <span className="shrink-0 text-right font-medium tabular-nums text-slate-200">
                        ${(booking.totalCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-slate-500">Guest service fee</span>
                      <span className="shrink-0 text-right font-medium tabular-nums text-slate-200">
                        ${(booking.guestFeeCents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-600/55 pt-3">
                    <span className="text-sm text-slate-500">
                      {translateServer(pageLocale, "bookings.totalDue")}
                    </span>
                    <span className="shrink-0 text-right text-2xl font-bold tabular-nums tracking-tight text-white">
                      ${(totalCharged / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <BookingAIInsight message={bookingAIDecisionMessage} />
                  <BnhubTrustSignals
                    stripeCheckoutAvailable={isStripeConfigured()}
                    variant="dark"
                    className="justify-center sm:justify-start"
                  />
                  <p className="text-xs text-slate-500">
                    {isStripeConfigured()
                      ? "No charge until confirmation"
                      : "You'll review all details before confirming"}
                  </p>
                  <BookingPayButton
                    bookingId={id}
                    amountCents={booking.payment?.amountCents ?? booking.totalCents + booking.guestFeeCents}
                    stripeConfigured={isStripeConfigured()}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {!showPaidConfirmation ? (
            <>
              <p className="mt-4 text-sm text-slate-400">
                {booking.listing.title} · {new Date(booking.checkIn).toLocaleDateString()} –{" "}
                {new Date(booking.checkOut).toLocaleDateString()}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">Listing ID {booking.listing.listingCode}</p>
            <p className="mt-2 text-sm text-slate-300">
              Payment progress:{" "}
              <span className="font-medium text-emerald-300">{paymentProgressMessage}</span>
            </p>
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
            <p className="mt-2 text-sm text-slate-400">Price per night (avg.)</p>
            <p className="mt-1 text-slate-100">
              $
              {(totalCharged / Math.max(1, booking.nights) / 100).toFixed(2)}
            </p>
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
              {isPending || awaitingApproval ? "Total before payment" : "Amount charged"}
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">
              ${(totalCharged / 100).toFixed(2)}
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment progress</p>
              <p className="mt-1">{paymentProgressMessage}</p>
              <p className="mt-1 text-xs text-slate-500">
                Marketplace: {marketplacePaymentStatus ?? "—"} · Legacy: {booking.payment?.status ?? "—"}
              </p>
            </div>
            {canApproveOrDecline && (
              <HostBookingActions bookingId={id} className="mt-6 flex flex-wrap gap-3" />
            )}
            {isHost &&
            isPending &&
            (booking.manualPaymentSettlement === "PENDING" ||
              booking.manualPaymentSettlement === "FAILED") ? (
              <HostManualPaymentActions
                bookingId={id}
                manualSettlement={booking.manualPaymentSettlement}
              />
            ) : null}
            {showGuestGuaranteeClaim ? <GuaranteeClaimButton bookingId={id} /> : null}
            {showOnlineCheckoutBlock ? (
              <p className="mt-6 text-xs text-slate-500">Payment: use the card at the top of this page.</p>
            ) : null}
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
            {showShareMyStay ? (
              <BookingShareMyStayBundle
                bookingId={id}
                checkOutIso={booking.checkOut.toISOString()}
                bookingPageId={id}
                isGuest={isGuest}
                isHost={isHost}
              />
            ) : (
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
                {isGuest && (
                  <Link
                    href={`/guest/payments/${id}`}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
                  >
                    Payment details
                  </Link>
                )}
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
            )}
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
