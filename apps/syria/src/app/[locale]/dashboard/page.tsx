import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { pickListingTitle } from "@/lib/listing-localized";
import { getSyriaPublicOrigin } from "@/lib/syria-whatsapp";
import { buildViralShareForSyriaProperty } from "@/lib/syria/viral-listing-share";
import { SelfMarketingPanel } from "@/components/dashboard/SelfMarketingPanel";
import { ViralPostShareBanner } from "@/components/dashboard/ViralPostShareBanner";

function tierKey(plan: string): "statusNormal" | "statusFeatured" {
  if (plan === "free") return "statusNormal";
  return "statusFeatured";
}

export default async function DashboardHomePage() {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const numberLoc = locale.startsWith("ar") ? "ar-SY" : "en-US";
  const user = await requireSessionUser();

  const [listingCount, bookingCount, paymentCount, listings] = await Promise.all([
    prisma.syriaProperty.count({ where: { ownerId: user.id } }),
    prisma.syriaBooking.count({
      where: {
        OR: [{ guestId: user.id }, { property: { ownerId: user.id } }],
      },
    }),
    prisma.syriaListingPayment.count({ where: { ownerId: user.id } }),
    prisma.syriaProperty.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const cardClass =
    "group block rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-6 shadow-none hover:border-[color:var(--darlink-accent)]/35";

  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-3">
        <Link href="/dashboard/listings" className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("homeListings")}</p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-[color:var(--darlink-text)]">{listingCount}</p>
          <p className="mt-4 text-sm font-medium text-[color:var(--darlink-accent)] group-hover:underline">{t("dashboardCardCta")}</p>
        </Link>
        <Link href="/dashboard/bookings" className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("homeBookingsLabel")}</p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-[color:var(--darlink-text)]">{bookingCount}</p>
          <p className="mt-4 text-sm font-medium text-[color:var(--darlink-accent)] group-hover:underline">{t("dashboardCardCta")}</p>
        </Link>
        <Link href="/dashboard/payments" className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("homePaymentsLabel")}</p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-[color:var(--darlink-text)]">{paymentCount}</p>
          <p className="mt-4 text-sm font-medium text-[color:var(--darlink-accent)] group-hover:underline">{t("dashboardCardCta")}</p>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[color:var(--darlink-text)]">{t("listingsTitle")}</h2>
        <p className="text-sm text-[color:var(--darlink-text-muted)]">{t("listingsSubtitle")}</p>
        {listings.length === 0 ? (
          <p className="rounded-[var(--darlink-radius-2xl)] border border-dashed border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-8 text-sm text-[color:var(--darlink-text-muted)]">
            {t("listingsEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">{t("tableTitle")}</th>
                  <th className="px-4 py-3">{t("tableCity")}</th>
                  <th className="px-4 py-3">{t("tablePrice")}</th>
                  <th className="px-4 py-3">{t("tableTier")}</th>
                  <th className="px-4 py-3">{t("tableViews")}</th>
                  <th className="px-4 py-3">{t("tableLeadsWhatsapp")}</th>
                  <th className="px-4 py-3">{t("tableLeadsPhone")}</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => {
                  const lowViewsViral =
                    l.status === "PUBLISHED" && (l.views ?? 0) < 5
                      ? buildViralShareForSyriaProperty(l, locale, numberLoc, origin)
                      : null;
                  return (
                    <tr key={l.id} className="border-t border-[color:var(--darlink-border)]">
                      <td className="px-4 py-3 font-medium text-[color:var(--darlink-text)]">
                        {l.status === "PUBLISHED" ? (
                          <Link href={`/listing/${l.id}`} className="hover:underline">
                            {pickListingTitle(l, locale)}
                          </Link>
                        ) : (
                          <span>{pickListingTitle(l, locale)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--darlink-text-muted)]">{l.city}</td>
                      <td className="px-4 py-3 tabular-nums">{money(l.price, l.currency, numberLoc)}</td>
                      <td className="px-4 py-3 text-[color:var(--darlink-text)]">{t(tierKey(l.plan))}</td>
                      <td className="px-4 py-3 text-[color:var(--darlink-text)]">
                        <span className="tabular-nums">{t("tableViewsValue", { count: l.views ?? 0 })}</span>
                        {lowViewsViral ? (
                          <div className="mt-1 max-w-xs space-y-1.5">
                            <p className="text-xs text-amber-800">{t("shareForViewsHint")}</p>
                            <a
                              href={lowViewsViral.whatsappHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-9 w-full min-w-0 max-w-[12rem] items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                            >
                              {t("lowViewsShareCta")}
                            </a>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[color:var(--darlink-text)]">{l.whatsappClicks ?? 0}</td>
                      <td className="px-4 py-3 tabular-nums text-[color:var(--darlink-text)]">{l.phoneClicks ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-sm text-[color:var(--darlink-text-muted)]">
          <Link href="/dashboard/listings" className="font-medium text-[color:var(--darlink-accent)] hover:underline">
            {t("allListingsLink")}
          </Link>
        </p>
      </section>

      <SelfMarketingPanel listings={listings} />
    </div>
  );
}
