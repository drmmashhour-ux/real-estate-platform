import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { verifyGuestBookingPayment, setBookingFraudFlag } from "@/actions/admin";
import { markBookingCheckedIn } from "@/actions/bookings";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";

export default async function AdminBookingsPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();

  const bookings = await prisma.syriaBooking.findMany({
    include: {
      property: true,
      guest: true,
      payouts: true,
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const autonomyQuickLink = getDarlinkAutonomyFlags().AUTONOMY_ENABLED ?
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-950">
      <Link href="/admin/autonomy" className="font-semibold underline underline-offset-2 hover:text-indigo-900">
        Marketplace autonomy dashboard
      </Link>
      <p className="mt-2 text-xs text-indigo-900/80">Booking friction signals and dry-run execution controls.</p>
    </div>
  : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("tileBookings")}</h2>
        <p className="text-sm text-stone-600">{t("bookingsIntro")}</p>
      </div>
      {autonomyQuickLink}
      <ul className="space-y-4">
        {bookings.map((b) => (
          <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/listing/${b.propertyId}`} className="text-lg font-semibold text-stone-900 hover:underline">
                  {pickListingTitle(b.property, locale)}
                </Link>
                <p className="text-sm text-stone-600">
                  {t("guestDates", {
                    email: b.guest.email,
                    from: b.checkIn.toISOString().slice(0, 10),
                    to: b.checkOut.toISOString().slice(0, 10),
                  })}
                </p>
                <p className="mt-2 font-medium">{money(b.totalPrice, b.currency)}</p>
                {b.nightlyRate ? (
                  <p className="text-xs text-stone-500">
                    {t("bookingNightsLine", {
                      nights: b.nightsCount,
                      nightly: money(b.nightlyRate, b.currency),
                    })}
                  </p>
                ) : null}
                {b.platformFeeAmount != null && b.hostNetAmount != null ? (
                  <p className="text-xs text-stone-600">
                    {t("bookingLedgerLine", {
                      platform: money(b.platformFeeAmount, b.currency),
                      hostNet: money(b.hostNetAmount, b.currency),
                    })}
                  </p>
                ) : null}
                <p className="text-sm text-stone-700">
                  {t("bookingStatusLine", {
                    booking: b.status,
                    guestPay: b.guestPaymentStatus,
                    payout: b.payoutStatus,
                  })}
                </p>
                <p className="text-xs text-stone-500">
                  {t("bookingRefs", {
                    ref: b.manualPaymentRef ?? "—",
                    proof: b.proofUrl ?? "—",
                  })}
                </p>
                {b.fraudFlag ? (
                  <p className="mt-2 text-xs font-semibold text-red-800">{t("fraudBadge")}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <form action={verifyGuestBookingPayment}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    {t("guestPaid")}
                  </button>
                </form>
                <form action={markBookingCheckedIn}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    {t("recordCheckIn")}
                  </button>
                </form>
                <form action={setBookingFraudFlag} className="flex gap-2">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input type="hidden" name="fraud" value={b.fraudFlag ? "false" : "true"} />
                  <button type="submit" className="text-xs font-semibold text-red-800 hover:underline">
                    {b.fraudFlag ? t("clearFraud") : t("flagFraud")}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
