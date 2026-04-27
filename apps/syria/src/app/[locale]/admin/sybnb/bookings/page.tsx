import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { adminSetSybnbBookingManualClear } from "@/actions/sybnb-admin";

function riskPillClass(r: "clear" | "review" | "blocked"): string {
  if (r === "clear") return "bg-emerald-100 text-emerald-900";
  if (r === "review") return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
}

export default async function AdminSybnbBookingsPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();

  const bookings = await prisma.syriaBooking.findMany({
    where: { property: { category: "stay" } },
    include: { property: true, guest: true, payouts: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbBookingsTitle")}</h2>
        <p className="text-sm text-stone-600">{t("sybnbBookingsIntro")}</p>
      </div>
      <ul className="space-y-4">
        {bookings.map((b) => {
          const risk = b.riskStatus;
          return (
            <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link href={`/sybnb/listings/${b.propertyId}`} className="text-lg font-semibold text-stone-900 hover:underline">
                    {pickListingTitle(b.property, locale)}
                  </Link>
                  <p className="text-sm text-stone-600">
                    {b.guest.email} · {b.checkIn.toISOString().slice(0, 10)} → {b.checkOut.toISOString().slice(0, 10)}
                  </p>
                  <p className="mt-1 text-sm text-stone-800">
                    {t("bookingStatusLine", { booking: b.status, guestPay: b.guestPaymentStatus, payout: b.payoutStatus })}
                  </p>
                  {b.nightlyRate ? (
                    <p className="text-xs text-stone-500">
                      {t("bookingNightsLine", {
                        nights: b.nightsCount,
                        nightly: money(b.nightlyRate, b.currency),
                      })}
                    </p>
                  ) : null}
                  <p className="mt-1 font-medium">{money(b.totalPrice, b.currency)}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskPillClass(risk)}`}
                  >
                    {t("sybnbRiskLabel")}: {String(risk)}
                  </span>
                  <form action={adminSetSybnbBookingManualClear} className="w-full sm:w-auto">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 sm:w-auto"
                    >
                      {t("sybnbClearRisk")}
                    </button>
                  </form>
                  <Link
                    href={`/sybnb/bookings/${b.id}`}
                    className="text-xs font-medium text-stone-600 underline-offset-2 hover:underline"
                  >
                    {t("sybnbOpenDetail")}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
