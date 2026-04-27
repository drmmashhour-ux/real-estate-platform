import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { markBookingCheckedIn } from "@/actions/bookings";
import { hostRespondSybnbBooking, runSybnbPostStayCompletion } from "@/actions/sybnb-booking";
import { describePayoutEligibility } from "@/lib/payout-policy";
import { pickListingTitle } from "@/lib/listing-localized";
import { bookingLifecycleLabel } from "@/lib/status-ui";
import { sybnbConfig } from "@/config/sybnb.config";
import { isSybnbCardCheckoutUiEnabled } from "@/lib/sybnb/payment-policy";
import { SybnbGuestPayStubButton } from "@/components/sybnb/SybnbGuestPayStubButton";

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
              <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-stone-500">
                      {isHost ? t("roleHosting") : t("roleGuest")}
                    </p>
                    <Link href={`/listing/${b.propertyId}`} className="text-lg font-semibold text-stone-900 hover:underline">
                      {pickListingTitle(b.property, locale)}
                    </Link>
                    <p className="text-sm text-stone-600">
                      {b.checkIn.toISOString().slice(0, 10)} → {b.checkOut.toISOString().slice(0, 10)}
                    </p>
                    {sybnbPhase ? <p className="mt-1 text-xs text-stone-500">{sybnbPhase}</p> : null}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{money(b.totalPrice, b.currency)}</p>
                    {b.nightlyRate ? (
                      <p className="text-xs text-stone-500">
                        {b.nightsCount}n × {money(b.nightlyRate, b.currency)}
                      </p>
                    ) : null}
                    {b.platformFeeAmount != null && b.hostNetAmount != null ? (
                      <p className="text-xs text-stone-500">
                        Fee {money(b.platformFeeAmount, b.currency)} · Net {money(b.hostNetAmount, b.currency)}
                      </p>
                    ) : null}
                    <p className="text-stone-600">
                      {t("guestPay")} {b.guestPaymentStatus}
                    </p>
                    <p className="text-stone-600">
                      {t("payout")} {b.payoutStatus}
                    </p>
                  </div>
                </div>

                {payout ? (
                  <p className="mt-2 text-xs text-stone-500">
                    {t("payoutHint", {
                      host: money(payout.amount, payout.currency),
                      fee: money(payout.platformFee, payout.currency),
                      ledger: payout.status,
                    })}
                  </p>
                ) : null}

                <p className="mt-2 text-xs text-stone-600">
                  {t("payoutGuidance")} {eligibility.notes} ({eligibility.reason})
                </p>

                {b.property.category === "stay" && isHost && b.status === "PENDING" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={hostRespondSybnbBooking}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="action" value="confirm" />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                      >
                        {t("sybnbConfirmRequest")}
                      </button>
                    </form>
                    <form action={hostRespondSybnbBooking}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="action" value="decline" />
                      <button
                        type="submit"
                        className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                      >
                        {t("sybnbDeclineRequest")}
                      </button>
                    </form>
                  </div>
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
