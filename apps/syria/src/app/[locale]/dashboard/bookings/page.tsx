import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { markBookingCheckedIn } from "@/actions/bookings";
import { runSybnbPostStayCompletion } from "@/actions/sybnb-booking";
import { describePayoutEligibility } from "@/lib/payout-policy";
import { pickListingTitle } from "@/lib/listing-localized";
import { bookingLifecycleLabel } from "@/lib/status-ui";
import { sybnbConfig } from "@/config/sybnb.config";
import { hostEscrowStatusLabel } from "@/lib/sybnb/payout-release-policy";
import { isSybnbCardCheckoutUiEnabled } from "@/lib/sybnb/payment-policy";
import { SybnbGuestPayStubButton } from "@/components/sybnb/SybnbGuestPayStubButton";
import { SybnbBookingCard } from "@/components/sybnb/SybnbBookingCard";
import { SybnbDashboardHostRespondForms } from "@/components/sybnb/SybnbDashboardHostRespondForms";

type BookingLifecycleLabel = ReturnType<typeof bookingLifecycleLabel>;

function sybnbPhaseKey(label: BookingLifecycleLabel): string {
  const m: Record<BookingLifecycleLabel, string> = {
    request_pending: "sybnbPhaseRequestPending",
    host_approved_awaiting_card: "sybnbPhaseHostApprovedAwaitingCard",
    host_approved_manual: "sybnbPhaseHostApprovedManual",
    pending: "sybnbPhasePending",
    pending_payment: "sybnbPhasePendingPayment",
    confirmed: "sybnbPhaseConfirmed",
    checked_in: "sybnbPhaseCheckedIn",
    completed: "sybnbPhaseCompleted",
    cancelled: "sybnbPhaseCancelled",
  };
  return m[label] ?? "sybnbPhasePending";
}

export default async function DashboardBookingsPage() {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const user = await requireSessionUser();

  await runSybnbPostStayCompletion();

  const bookings = await prisma.syriaBooking.findMany({
    where: {
      OR: [{ guestId: user.id }, { property: { ownerId: user.id } }],
    },
    include: {
      property: true,
      guest: true,
      payouts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">{t("bookingsTitle")}</h2>
      <p className="text-sm text-stone-600">{t("bookingsIntro")}</p>
      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-sm text-stone-600">
          {t("bookingsEmpty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const isHost = b.property.ownerId === user.id;
            const eligibility = describePayoutEligibility({ checkedInAt: b.checkedInAt });
            const payout = b.payouts[0];
            const hostEscrowLine =
              isHost && b.property.category === "stay" && payout && sybnbConfig.escrowEnabled
                ? (() => {
                    const k = hostEscrowStatusLabel(payout.escrowStatus);
                    if (k === "held") return t("hostEscrowHeld");
                    if (k === "review") return t("hostEscrowReview");
                    if (k === "eligibleSoon") return t("hostEscrowEligibleSoon");
                    if (k === "released") return t("hostEscrowReleased");
                    return t("hostEscrowBlocked");
                  })()
                : null;
            const showSybnbPayStub =
              b.property.category === "stay" &&
              !isHost &&
              b.status === "APPROVED" &&
              b.guestPaymentStatus === "UNPAID" &&
              isSybnbCardCheckoutUiEnabled(sybnbConfig.provider);
            const sybnbPhase =
              b.property.category === "stay"
                ? t("sybnbPhaseLabel", { phase: t(sybnbPhaseKey(bookingLifecycleLabel(b))) })
                : null;

            return (
              <SybnbBookingCard
                key={b.id}
                roleLabel={isHost ? t("roleHosting") : t("roleGuest")}
                propertyTitle={pickListingTitle(b.property, locale)}
                propertyHref={`/listing/${b.propertyId}`}
                checkInOut={`${b.checkIn.toISOString().slice(0, 10)} → ${b.checkOut.toISOString().slice(0, 10)}`}
                amountPrimary={money(b.totalPrice, b.currency)}
                amountSub={b.nightlyRate ? `${b.nightsCount}n × ${money(b.nightlyRate, b.currency)}` : null}
                amountBreakdown={
                  b.platformFeeAmount != null && b.hostNetAmount != null
                    ? `Fee ${money(b.platformFeeAmount, b.currency)} · Net ${money(b.hostNetAmount, b.currency)}`
                    : null
                }
                guestPayLine={`${t("guestPay")} ${b.guestPaymentStatus}`}
                payoutStatusLine={`${t("payout")} ${b.payoutStatus}`}
                sybnbPhaseLine={sybnbPhase}
                payoutHint={
                  payout
                    ? t("payoutHint", {
                        host: money(payout.amount, payout.currency),
                        fee: money(payout.platformFee, payout.currency),
                        ledger: payout.status,
                      })
                    : null
                }
                hostEscrowLine={hostEscrowLine}
                guidanceLine={`${t("payoutGuidance")} ${eligibility.notes} (${eligibility.reason})`}
              >
                {b.property.category === "stay" && isHost && b.status === "PENDING" ? (
                  <SybnbDashboardHostRespondForms
                    bookingId={b.id}
                    confirmLabel={t("sybnbConfirmRequest")}
                    declineLabel={t("sybnbDeclineRequest")}
                  />
                ) : null}

                {showSybnbPayStub ? <SybnbGuestPayStubButton bookingId={b.id} /> : null}

                {isHost || user.role === "ADMIN" ? (
                  <form action={markBookingCheckedIn} className="mt-3 inline">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                    >
                      {t("checkInBtn")}
                    </button>
                  </form>
                ) : null}
              </SybnbBookingCard>
            );
          })}
        </ul>
      )}
    </div>
  );
}
