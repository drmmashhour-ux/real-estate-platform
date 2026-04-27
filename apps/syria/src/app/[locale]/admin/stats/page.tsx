import { getLocale, getTranslations } from "next-intl/server";
import { AdminF1Tabs } from "@/components/admin/AdminF1Tabs";
import { AdminStatsBarChart } from "@/components/admin/AdminStatsBarChart";
import {
  getAdminEngagementSums,
  getAdminF1PricingTierStats,
  getAdminListingStats,
  getAdminMoneyStats,
  getLast7DaysListingViewTrend,
  type DayCount,
  type F1TierKpi,
} from "@/lib/admin-stats";

function fmtMoney(n: number, locale: string) {
  if (locale.toLowerCase().startsWith("ar")) {
    return `${n.toLocaleString("ar-SY", { maximumFractionDigits: 0 })} ل.س`;
  }
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} SYP`;
}

function fmtInt(n: number, locale: string) {
  return n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US");
}

export default async function AdminStatsPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();

  const [money, listings, engagement, trend, f1tier] = await Promise.all([
    getAdminMoneyStats(),
    getAdminListingStats(),
    getAdminEngagementSums(),
    getLast7DaysListingViewTrend(locale),
    getAdminF1PricingTierStats(),
  ]);

  const chartPoints = trend.map((d: DayCount) => ({ label: d.label, value: d.count }));
  const maxT = Math.max(1, ...trend.map((d: DayCount) => d.count));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("statsTitle")}</h2>
        <p className="mt-1 text-sm text-stone-600">{t("statsIntro")}</p>
      </div>

      <AdminF1Tabs current="stats" t={t} />

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-stone-800">💰 {t("statsSectionMoney")}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { k: t("statsMoneyToday"), v: money.today },
            { k: t("statsMoneyWeek"), v: money.week },
            { k: t("statsMoneyTotal"), v: money.total },
          ].map((row) => (
            <div
              key={row.k}
              className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{row.k}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-950" dir="ltr">
                {fmtMoney(row.v, locale)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500">{t("statsMoneyFootnote")}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-stone-800">🧪 {t("statsSectionF1Tier")}</h3>
        <p className="text-sm text-stone-600">{t("statsF1TierIntro")}</p>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">{t("statsF1AbColTier")}</th>
                <th className="px-3 py-2">{t("statsF1AbRequests")}</th>
                <th className="px-3 py-2">{t("statsF1AbConfirmed")}</th>
                <th className="px-3 py-2">{t("statsF1AbRevenue")}</th>
                <th className="px-3 py-2">{t("statsF1AbConv")}</th>
              </tr>
            </thead>
            <tbody>
              {f1tier.tiers.map((b: F1TierKpi) => {
                const conv =
                  b.tier === 0
                    ? f1tier.conversionRate0
                    : b.tier === 1
                      ? f1tier.conversionRate1
                      : f1tier.conversionRate2;
                return (
                  <tr key={b.tier} className="border-t border-stone-100">
                    <td className="px-3 py-2 font-medium text-stone-900">
                      {t("statsF1AbTierLabel", { n: String(b.tier) })}
                    </td>
                    <td className="px-3 py-2 tabular-nums" dir="ltr">
                      {fmtInt(b.requests, locale)}
                    </td>
                    <td className="px-3 py-2 tabular-nums" dir="ltr">
                      {fmtInt(b.confirmed, locale)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-amber-950" dir="ltr">
                      {fmtMoney(b.revenue, locale)}
                    </td>
                    <td className="px-3 py-2 tabular-nums" dir="ltr">
                      {conv.toLocaleString(
                        locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US",
                        { style: "percent", maximumFractionDigits: 1 },
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500">{t("statsF1LadderFootnote")}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-stone-800">📈 {t("statsSectionActivity")}</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: t("statsListingsCount"), n: listings.total },
            { k: t("statsListingsActive"), n: listings.active },
            { k: t("statsListingsExpiredBoost"), n: listings.expiredBoost },
            { k: t("statsListingsArchived"), n: listings.archived },
          ].map((row) => (
            <div key={row.k} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="text-xs text-stone-500">{row.k}</p>
              <p className="text-xl font-bold tabular-nums text-stone-900" dir="ltr">
                {fmtInt(row.n, locale)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500">{t("statsActivityFootnote")}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-stone-800">🔥 {t("statsSectionEngagement")}</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { k: t("statsEngViews"), n: engagement.views },
            { k: t("statsEngWhatsapp"), n: engagement.whatsapp },
            { k: t("statsEngPhone"), n: engagement.phone },
          ].map((row) => (
            <div key={row.k} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
              <p className="text-xs text-stone-500">{row.k}</p>
              <p className="text-xl font-bold tabular-nums text-stone-900" dir="ltr">
                {fmtInt(row.n, locale)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500">{t("statsEngagementFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800">📊 {t("statsSectionChart")}</h3>
        <p className="text-sm text-stone-600">{t("statsChartBlurb", { max: maxT })}</p>
        <div className="mt-4">
          <AdminStatsBarChart
            title={t("statsChartTitleViews")}
            valueLabel={t("statsChartHintViews")}
            points={chartPoints}
          />
        </div>
      </section>
    </div>
  );
}
