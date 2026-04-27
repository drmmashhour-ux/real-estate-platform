import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { pickListingTitle } from "@/lib/listing-localized";
import { money } from "@/lib/format";
import { bookingLifecycleLabel } from "@/lib/status-ui";
import { hostRespondSybnbBooking } from "@/actions/sybnb-booking";
import { isSybnbCardCheckoutUiEnabled } from "@/lib/sybnb/payment-policy";
import { sybnbConfig } from "@/config/sybnb.config";
import { SybnbGuestPayStubButton } from "@/components/sybnb/SybnbGuestPayStubButton";

type PhaseKey =
  | "sybnbPhaseRequestPending"
  | "sybnbPhaseHostApprovedAwaitingCard"
  | "sybnbPhaseHostApprovedManual"
  | "sybnbPhasePending"
  | "sybnbPhasePendingPayment"
  | "sybnbPhaseConfirmed"
  | "sybnbPhaseCheckedIn"
  | "sybnbPhaseCompleted"
  | "sybnbPhaseCancelled";

function phaseToKey(label: ReturnType<typeof bookingLifecycleLabel>): PhaseKey {
  const m: Record<ReturnType<typeof bookingLifecycleLabel>, PhaseKey> = {
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

function riskTone(r: "clear" | "review" | "blocked"): "ok" | "warn" | "bad" {
  if (r === "clear") return "ok";
  if (r === "review") return "warn";
  return "bad";
}

/** Legacy `SyriaBooking` (stay) — separate from SYBNB-1 `SybnbBooking` request flow. */
export async function LegacySyriaStayBookingDetail({ id }: { id: string }) {
  const t = await getTranslations("Sybnb.booking");
  const tDash = await getTranslations("Dashboard");
  const appLocale = await getLocale();
  const u = await requireSessionUser();

  const booking = await prisma.syriaBooking.findUnique({
    where: { id },
    include: { property: { include: { owner: true } }, guest: true, payouts: true },
  });
  if (!booking) {
    notFound();
  }
  if (booking.property.category !== "stay") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 [dir=rtl]:text-right">
        {t("notStay")}
      </div>
    );
  }

  const isHost = booking.property.ownerId === u.id;
  const isGuest = booking.guestId === u.id;
  const isAdmin = u.role === "ADMIN";
  if (!isHost && !isGuest && !isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center text-sm text-amber-950 [dir=rtl]:text-right">
        {t("forbidden")}
      </div>
    );
  }

  const label = bookingLifecycleLabel(booking);
  const phaseKey = phaseToKey(label);
  const phaseLine = tDash("sybnbPhaseLabel", { phase: tDash(phaseKey) });
  const risk = booking.riskStatus;
  const riskClass =
    riskTone(risk) === "ok"
      ? "text-emerald-800 bg-emerald-50 border-emerald-200"
      : riskTone(risk) === "warn"
        ? "text-amber-900 bg-amber-50 border-amber-200"
        : "text-red-800 bg-red-50 border-red-200";

  const showSybnbPayStub =
    !isHost &&
    booking.status === "APPROVED" &&
    booking.guestPaymentStatus === "UNPAID" &&
    isSybnbCardCheckoutUiEnabled(sybnbConfig.provider);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1 [dir=rtl]:text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">SYBNB</p>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{pickListingTitle(booking.property, appLocale)}</p>
      </header>

      <div className={`rounded-2xl border px-4 py-3 text-sm [dir=rtl]:text-right ${riskClass}`}>
        <p className="text-xs font-semibold uppercase tracking-wide">{t("risk")}</p>
        <p className="mt-0.5 font-medium">{String(risk)}</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm [dir=rtl]:text-right">
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
          <span className="text-neutral-500">{t("status")}</span>
          <span className="font-medium text-neutral-900">{String(booking.status)}</span>
        </div>
        <p className="text-xs text-neutral-600">{phaseLine}</p>
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
          <span className="text-neutral-500">{t("payment")}</span>
          <span className="font-medium text-neutral-900">{String(booking.guestPaymentStatus)}</span>
        </div>
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
          <span className="text-neutral-500">{t("payout")}</span>
          <span className="font-medium text-neutral-900">
            {booking.payouts[0] ? String(booking.payouts[0].status) : "—"}
          </span>
        </div>
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold uppercase text-neutral-500">{t("dates")}</p>
          <p className="mt-1 text-sm text-neutral-800">
            {booking.checkIn.toISOString().slice(0, 10)} → {booking.checkOut.toISOString().slice(0, 10)}
          </p>
          <p className="text-xs text-neutral-500">
            {t("nights", { n: booking.nightsCount })}
          </p>
        </div>
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-xs font-semibold uppercase text-neutral-500">{t("total")}</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">{money(booking.totalPrice, booking.currency)}</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-5 [dir=rtl]:text-right sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">{t("guest")}</p>
          <p className="mt-1 text-sm font-medium text-neutral-900">{booking.guest.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">{t("host")}</p>
          <p className="mt-1 text-sm font-medium text-neutral-900">{booking.property.owner.email}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-900/10 bg-neutral-950 p-5 text-sm text-neutral-100 [dir=rtl]:text-right">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">{t("nextAction")}</p>
        <p className="mt-2 text-neutral-200">{phaseLine}</p>
        {isHost && booking.status === "PENDING" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={hostRespondSybnbBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="action" value="confirm" />
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                {tDash("sybnbConfirmRequest")}
              </button>
            </form>
            <form action={hostRespondSybnbBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="action" value="decline" />
              <button
                type="submit"
                className="rounded-lg border border-neutral-600 bg-transparent px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-900"
              >
                {tDash("sybnbDeclineRequest")}
              </button>
            </form>
          </div>
        ) : null}
        {showSybnbPayStub ? (
          <div className="mt-4">
            <SybnbGuestPayStubButton bookingId={booking.id} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={`/sybnb/listings/${booking.propertyId}`}
          className="font-medium text-amber-800 underline-offset-2 hover:underline"
        >
          {t("goListing")}
        </Link>
        <Link href="/dashboard/bookings" className="font-medium text-neutral-600 underline-offset-2 hover:underline">
          {t("goBookings")}
        </Link>
      </div>
    </div>
  );
}
