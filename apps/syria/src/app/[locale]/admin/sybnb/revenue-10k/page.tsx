import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  SYBNB73_MONTHLY_TARGET_USD,
  SYBNB73_REVENUE_LINES,
  SYBNB73_HOTELS_COUNT,
  SYBNB73_HOTEL_AVG_MONTHLY_USD,
  SYBNB73_FEATURED_PER_DAY,
  SYBNB73_FEATURED_PRICE_USD,
  SYBNB73_DAYS_PER_MONTH,
  SYBNB73_PREMIUM_SLOTS_PER_MONTH,
  SYBNB73_PREMIUM_PRICE_USD,
  sybnb73ComputedFloorMonthlyUsd,
  type Sybnb73RevenueLineId,
} from "@/lib/sybnb/sybnb-revenue-10k-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("revenue10kPageTitle"),
    description: t("revenue10kSubtitle"),
  };
}

function lineDetail(t: Awaited<ReturnType<typeof getTranslations>>, id: Sybnb73RevenueLineId): string {
  switch (id) {
    case "hotels":
      return t("revenue10kLineHotelsDetail", {
        count: SYBNB73_HOTELS_COUNT,
        avg: SYBNB73_HOTEL_AVG_MONTHLY_USD,
      });
    case "featuredListings":
      return t("revenue10kLineFeaturedDetail", {
        perDay: SYBNB73_FEATURED_PER_DAY,
        price: SYBNB73_FEATURED_PRICE_USD,
        days: SYBNB73_DAYS_PER_MONTH,
      });
    case "premiumListings":
      return t("revenue10kLinePremiumDetail", {
        slots: SYBNB73_PREMIUM_SLOTS_PER_MONTH,
        price: SYBNB73_PREMIUM_PRICE_USD,
      });
    case "agentBookings":
      return t("revenue10kLineAgentsDetail");
    default:
      return "";
  }
}

function lineTitle(t: Awaited<ReturnType<typeof getTranslations>>, id: Sybnb73RevenueLineId): string {
  switch (id) {
    case "hotels":
      return t("revenue10kLineHotelsTitle");
    case "featuredListings":
      return t("revenue10kLineFeaturedTitle");
    case "premiumListings":
      return t("revenue10kLinePremiumTitle");
    case "agentBookings":
      return t("revenue10kLineAgentsTitle");
    default:
      return "";
  }
}

export default async function AdminSybnbRevenue10kPage() {
  const t = await getTranslations("Admin");
  const floorTotal = sybnb73ComputedFloorMonthlyUsd();

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("revenue10kKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("revenue10kTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("revenue10kSubtitle")}</p>
        <p className="mt-3 inline-flex flex-wrap items-baseline gap-2 text-sm font-semibold text-stone-900">
          <span>{t("revenue10kTargetLabel", { amount: SYBNB73_MONTHLY_TARGET_USD })}</span>
          <span className="text-xs font-normal text-stone-600">{t("revenue10kTargetHint")}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("revenue10kMixSectionTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("revenue10kMixLead")}</p>

        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-stone-900">
                  {t("revenue10kColStream")}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-semibold text-stone-900">
                  {t("revenue10kColFormula")}
                </th>
                <th scope="col" className="px-4 py-3 text-end font-semibold text-stone-900">
                  {t("revenue10kColMonthlyUsd")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {SYBNB73_REVENUE_LINES.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-900">{lineTitle(t, row.id)}</td>
                  <td className="px-4 py-3 text-stone-700">{lineDetail(t, row.id)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-end tabular-nums text-stone-900">
                    ${row.monthlyUsd.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50/80 font-semibold">
                <td className="px-4 py-3 text-emerald-950" colSpan={2}>
                  {t("revenue10kFloorTotalLabel")}
                </td>
                <td className="px-4 py-3 text-end tabular-nums text-emerald-950">${floorTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-stone-500">{t("revenue10kMixFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-950">{t("revenue10kStrategyTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-indigo-950/95">
          <li>{t("revenue10kStrategy1")}</li>
          <li>{t("revenue10kStrategy2")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("revenue10kTiersSectionTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("revenue10kTiersLead")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50/90 p-4">
            <h3 className="text-sm font-semibold text-stone-900">{t("revenue10kTierBasicTitle")}</h3>
            <p className="mt-2 text-sm text-stone-700">{t("revenue10kTierBasicBody")}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <h3 className="text-sm font-semibold text-emerald-950">{t("revenue10kTierFeaturedTitle")}</h3>
            <p className="mt-2 text-sm text-emerald-950/95">{t("revenue10kTierFeaturedBody")}</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4">
            <h3 className="text-sm font-semibold text-violet-950">{t("revenue10kTierPremiumTitle")}</h3>
            <p className="mt-2 text-sm text-violet-950/95">{t("revenue10kTierPremiumBody")}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-950">{t("revenue10kRuleTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-rose-950/95">{t("revenue10kRuleBody")}</p>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("revenue10kSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("revenue10kSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">
          <Link href="/admin/sybnb/revenue-optimization" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
            {t("revenue10kLinkRevOpt")}
          </Link>
        </p>
      </section>
    </div>
  );
}
