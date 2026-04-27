import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { pickListingTitle } from "@/lib/listing-localized";
import { SybnbV1HostActions } from "@/components/sybnb/SybnbV1HostActions";
export default async function SybnbHostPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations("Sybnb.host");
  const user = await requireSessionUser();

  const [listings, v1Requests, unreviewedTotal] = await Promise.all([
    prisma.syriaProperty.findMany({
      where: { ownerId: user.id, category: "stay" },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.sybnbBooking.findMany({
      where: {
        hostId: user.id,
        status: "requested",
      },
      include: { listing: true, guest: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.sybnbListingReport.count({
      where: {
        reviewed: false,
        property: { ownerId: user.id, category: "stay" },
      },
    }),
  ]);

  const verificationLabel =
    user.verificationLevel?.trim() ||
    (user.phoneVerifiedAt || user.verifiedAt ? t("verificationHasPhone") : null);

  return (
    <div className="space-y-10">
      <header className="space-y-1 [dir=rtl]:text-right">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-600">{t("subtitle")}</p>
      </header>

      {unreviewedTotal > 0 ? (
        <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-amber-100/40 px-4 py-3 text-sm text-amber-950 [dir=rtl]:text-right">
          <p className="font-medium">{t("reportsWarning", { count: unreviewedTotal })}</p>
          <p className="mt-1 text-xs text-amber-900/85">{t("reportsHint")}</p>
        </div>
      ) : (
        <p className="rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-sm text-neutral-600 [dir=rtl]:text-right">
          {t("reportsWarning", { count: 0 })}
        </p>
      )}

      <section className="space-y-3 [dir=rtl]:text-right">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-900">{t("myListings")}</h2>
          <Link
            href="/dashboard/listings"
            className="text-xs font-medium text-amber-800 underline-offset-2 hover:underline"
          >
            {t("addListing")}
          </Link>
        </div>
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-10 text-center text-sm text-neutral-500">
            {t("noListings")}
          </p>
        ) : (
          <ul className="space-y-3">
            {listings.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-neutral-900">{pickListingTitle(l, locale)}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {t("sybnbReview", { state: t(`reviewState_${l.sybnbReview}`) })} ·{" "}
                    {t("listingStatus", { status: t(`propStatus_${l.status}`) })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/sybnb/listings/${l.id}`}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-800 transition hover:border-amber-300/60"
                  >
                    {t("viewSybnb")}
                  </Link>
                  <Link
                    href={`/listing/${l.id}`}
                    className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-neutral-800"
                  >
                    {t("viewCanonical")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 [dir=rtl]:text-right">
        <h2 className="text-sm font-semibold text-neutral-900">{t("requests")}</h2>
        {v1Requests.length === 0 ? (
          <p className="rounded-2xl border border-neutral-200/80 bg-white px-4 py-6 text-sm text-neutral-500">{t("noRequests")}</p>
        ) : (
          <ul className="space-y-2">
            {v1Requests.map((b) => (
              <li
                key={b.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{pickListingTitle(b.listing, locale)}</p>
                  <p className="text-xs text-neutral-500">
                    {b.guest.email} · {b.checkIn.toISOString().slice(0, 10)} → {b.checkOut.toISOString().slice(0, 10)} ·{" "}
                    {b.guests} {t("v1.guestsShort")}
                  </p>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/sybnb/requests/${b.id}`}
                      className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950"
                    >
                      {t("v1.openRequest")}
                    </Link>
                  </div>
                  <SybnbV1HostActions bookingId={b.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="pt-1">
          <Link href="/dashboard/bookings" className="text-sm font-medium text-amber-800 underline-offset-2 hover:underline">
            {t("openDashboard")}
          </Link>
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm [dir=rtl]:text-right">
          <h2 className="text-sm font-semibold text-neutral-900">{t("earningsTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{t("earningsPlaceholder")}</p>
        </div>
        <div className="rounded-2xl border border-neutral-900/10 bg-neutral-900 p-5 text-white [dir=rtl]:text-right">
          <h2 className="text-sm font-semibold text-amber-200">{t("verificationTitle")}</h2>
          <p className="mt-2 text-sm text-neutral-200">
            {verificationLabel
              ? t("verificationLevel", { level: verificationLabel })
              : t("verificationNone")}
          </p>
        </div>
      </div>
    </div>
  );
}
