import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminStatsBarChart } from "@/components/admin/AdminStatsBarChart";
import {
  getSybnbInvestorActivityLast7Days,
  getSybnbInvestorDemoListingId,
  getSybnbInvestorGrowthTrend,
  getSybnbInvestorKpis,
  getSybnbInvestorTopCities,
} from "@/lib/admin-sybnb-investor-metrics";

function fmtInt(n: number, locale: string) {
  return n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US");
}

export default async function AdminInvestorReadinessPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();

  const [kpis, growth, topCities, activity7, demoListingId] = await Promise.all([
    getSybnbInvestorKpis(),
    getSybnbInvestorGrowthTrend(locale, 14),
    getSybnbInvestorTopCities(8),
    getSybnbInvestorActivityLast7Days(),
    getSybnbInvestorDemoListingId(),
  ]);

  const viewPoints = growth.map((d) => ({ label: d.label, value: d.views }));
  const reqPoints = growth.map((d) => ({ label: d.label, value: d.bookingRequests }));

  const conversionDisplay =
    kpis.conversionBookingRowsPerViewPct == null ? "—" : `${fmtPct(kpis.conversionBookingRowsPerViewPct, locale)}`;

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("investorReadinessKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("investorReadinessTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-stone-700">{t("investorReadinessSubtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("investorSectionKpis")}</h2>
        <p className="text-xs text-stone-500">{t("investorKpisFootnote")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={t("investorMetricTotalListings")} value={fmtInt(kpis.totalListings, locale)} />
          <MetricCard label={t("investorMetricActiveUsers")} value={fmtInt(kpis.activeUsers30d, locale)} />
          <MetricCard label={t("investorMetricBookingRows")} value={fmtInt(kpis.bookingRequestsRows, locale)} />
          <MetricCard label={t("investorMetricConversion")} value={conversionDisplay} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{t("investorMetricTrackedViews")}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900" dir="ltr">
              {fmtInt(kpis.listingViewsTracked, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {t("investorMetricBookingRequestEvents")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-stone-900" dir="ltr">
              {fmtInt(kpis.bookingRequestEvents, locale)}
            </p>
          </div>
        </div>
        <p className="text-xs text-stone-500">
          {t("investorConversionExplain", {
            requests: kpis.bookingRequestsRows,
            views: kpis.listingViewsTracked,
          })}
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <AdminStatsBarChart
            title={t("investorGrowthViewsChart")}
            valueLabel={t("investorGrowthChartHint")}
            points={viewPoints}
          />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <AdminStatsBarChart
            title={t("investorGrowthRequestsChart")}
            valueLabel={t("investorGrowthChartHint")}
            points={reqPoints}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("investorTopCitiesTitle")}</h2>
        {topCities.length === 0 ? (
          <p className="text-sm text-stone-600">{t("investorTopCitiesEmpty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-2">{t("investorCityCol")}</th>
                  <th className="px-4 py-2">{t("investorListingsCol")}</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((row) => (
                  <tr key={row.city} className="border-t border-stone-100">
                    <td className="px-4 py-2 font-medium text-stone-900">{row.city}</td>
                    <td className="px-4 py-2 tabular-nums text-stone-800" dir="ltr">
                      {fmtInt(row.count, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("investorActivityTitle")}</h2>
        <p className="text-xs text-stone-500">{t("investorActivityFootnote")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label={t("investorActivityViews")} value={fmtInt(activity7.listingViews, locale)} />
          <MetricCard label={t("investorActivityContacts")} value={fmtInt(activity7.contactClicks, locale)} />
          <MetricCard label={t("investorActivityBookingReq")} value={fmtInt(activity7.bookingRequests, locale)} />
          <MetricCard label={t("investorActivityReports")} value={fmtInt(activity7.reportsSubmitted, locale)} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-950">{t("investorStoryTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-950/90">{t("investorStoryBody")}</p>
        </div>
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-950">{t("investorPositioningTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("investorPositioningBody")}</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{t("investorDemoTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("investorDemoIntro")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sybnb?category=stay&governorate=Damascus&city=Damascus"
            className="inline-flex min-h-11 items-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
          >
            {t("investorDemoSearch")}
          </Link>
          {demoListingId ? (
            <>
              <Link
                href={`/sybnb/listings/${demoListingId}#sybnb-contact-panel`}
                className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100"
              >
                {t("investorDemoContact")}
              </Link>
              <Link
                href={`/sybnb/listings/${demoListingId}#sybnb-request-anchor`}
                className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100"
              >
                {t("investorDemoRequest")}
              </Link>
            </>
          ) : (
            <p className="text-sm text-amber-900/90">{t("investorDemoNoListing")}</p>
          )}
        </div>
        <p className="text-xs text-stone-500">{t("investorDemoFootnote")}</p>
        <p className="text-xs text-stone-400">{t("investorDemoAdminLinks")}</p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}

function fmtPct(n: number, locale: string) {
  return `${n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US", { maximumFractionDigits: 2 })}%`;
}
