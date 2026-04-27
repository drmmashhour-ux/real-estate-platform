import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { G4DailyLogCopy } from "@/components/admin/G4DailyLogCopy";
import {
  formatG4DailyLogLine,
  G4_WEEKLY_TARGETS,
  G5_EXPAND_MIN_LISTINGS,
  getG4DailySnapshotUTC,
  getG4NewPublishedListingsLast7Days,
  getG4TopCategoryByWhatsappClicks,
  getG4TopCityByEngagement,
  getG4WeakListings,
  getG5DirectShareInCity,
  getG5PublishedCountInCity,
  getG5TopCityByWhatsappClicks,
} from "@/lib/growth-operating-metrics";
import { isMarketplaceCategory } from "@/lib/marketplace-categories";
import {
  countGrowthEventsByTypeSince,
  getSyriaRevenueRollup,
  topUtmCampaignsSince,
  leadsBySourceSince,
  bookingsBySourceSince,
  topListingsByViewsSince,
} from "@/lib/growth-events";
import { money } from "@/lib/format";
import { getSyriaAutonomyMode } from "@/config/syria-platform.config";
import { SYRIA_PRICING } from "@/lib/pricing";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { buildMarketplaceSnapshot } from "@/modules/autonomy/darlink-marketplace-snapshot.service";
import { buildMarketplaceSignals } from "@/modules/autonomy/darlink-signal-builder.service";
import { autonomySignalsForGrowthHints } from "@/modules/autonomy/integrations/darlink-growth-bridge.service";
import { getAdminMoneyStats } from "@/lib/admin-stats";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

export default async function AdminGrowthPage() {
  const t = await getTranslations("Admin");
  const tCat = await getTranslations("Categories");
  const locale = await getLocale();
  const numberLoc = locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US";
  const since30 = daysAgo(30);

  const [
    listingsCreated,
    activeListings,
    inquiriesCount,
    bookingsCount,
    eventCounts,
    revenue,
    topCampaigns,
    leadSources,
    bookingSources,
    topViews,
    g4Daily,
    g4TopCat,
    g4TopCity,
    g4Weak,
    g4NewWeek,
    g5TopCity,
    moneyStats,
    hotListingsCount,
  ] = await Promise.all([
    prisma.syriaProperty.count({ where: { createdAt: { gte: since30 } } }),
    prisma.syriaProperty.count({ where: { status: "PUBLISHED", fraudFlag: false } }),
    prisma.syriaInquiry.count({ where: { createdAt: { gte: since30 } } }),
    prisma.syriaBooking.count({ where: { createdAt: { gte: since30 } } }),
    countGrowthEventsByTypeSince(since30),
    getSyriaRevenueRollup(since30),
    topUtmCampaignsSince(since30, 10),
    leadsBySourceSince(since30),
    bookingsBySourceSince(since30),
    topListingsByViewsSince(since30, 8),
    getG4DailySnapshotUTC(),
    getG4TopCategoryByWhatsappClicks(),
    getG4TopCityByEngagement(),
    getG4WeakListings(25),
    getG4NewPublishedListingsLast7Days(),
    getG5TopCityByWhatsappClicks(),
    getAdminMoneyStats(),
    prisma.syriaProperty.count({
      where: { status: "PUBLISHED", fraudFlag: false, views: { gte: 10 } },
    }),
  ]);

  const g4LogText = formatG4DailyLogLine(g4Daily);
  const g4TopCategoryLabel = g4TopCat.category
    ? isMarketplaceCategory(g4TopCat.category)
      ? tCat(g4TopCat.category)
      : g4TopCat.category
    : "—";

  const g5CityKey = g5TopCity.city;
  const g5CityStats = g5CityKey
    ? await (async () => {
        const [n, d] = await Promise.all([
          getG5PublishedCountInCity(g5CityKey),
          getG5DirectShareInCity(g5CityKey),
        ]);
        return { listings: n, direct: d.direct, total: d.total };
      })()
    : { listings: 0, direct: 0, total: 0 };

  const g5CityLabel =
    g5TopCity.city != null
      ? locale.toLowerCase().startsWith("ar") && g5TopCity.cityAr
        ? g5TopCity.cityAr
        : g5TopCity.city
      : "—";

  const g5ExpandReady =
    g5CityStats.listings >= G5_EXPAND_MIN_LISTINGS && g4Daily.wa >= 1;

  const listingViews = eventCounts["listing_view"] ?? 0;
  const searches = eventCounts["search_performed"] ?? 0;
  const homes = eventCounts["homepage_view"] ?? 0;

  const propertiesByView = await prisma.syriaProperty.findMany({
    where: { id: { in: topViews.map((x) => x.propertyId) } },
    select: { id: true, titleAr: true, city: true },
  });
  const titleMap = new Map(propertiesByView.map((p) => [p.id, p]));

  const defaultCurrency = revenue.verifiedByCurrency[0]?.currency ?? SYRIA_PRICING.currency;

  const playbookReportSnapshot = [
    `${t("playbookReportTopCity")}: ${g5CityLabel}`,
    `${t("playbookReportTopCategory")}: ${g4TopCategoryLabel}`,
    `${t("playbookReportHotListings")}: ${hotListingsCount}`,
    `${t("playbookReportNewListingsToday")}: ${g4Daily.newListings}`,
    `${t("playbookReportMessagesSent")}: `,
    `${t("playbookReportWaClicksToday")}: ${g4Daily.wa}`,
    `${t("playbookReportUpgradeReq")}: ${g4Daily.f1Requests}`,
    `${t("playbookReportConfirmed")}: ${g4Daily.f1Confirmed}`,
    `${t("playbookReportRevenueToday")}: ${money(moneyStats.today, defaultCurrency)}`,
  ].join("\n");

  let autonomyGrowthHints: string[] = [];
  if (getDarlinkAutonomyFlags().AUTONOMY_ENABLED) {
    try {
      const snap = await buildMarketplaceSnapshot({ portfolio: true });
      const sigs = buildMarketplaceSignals(snap);
      autonomyGrowthHints = [...autonomySignalsForGrowthHints(sigs)];
    } catch {
      autonomyGrowthHints = [];
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("growthTitle")}</h2>
        <p className="text-sm text-stone-600">{t("growthIntro", { days: 30 })}</p>
        <p className="mt-2 text-xs text-stone-500">
          {t("growthAutonomyMode", { mode: getSyriaAutonomyMode() })}
        </p>
        {autonomyGrowthHints.length > 0 ? (
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950">
            <p className="font-semibold text-indigo-950">Autonomy × growth (hints only)</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {autonomyGrowthHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-2xl border border-sky-200/80 bg-sky-50/50 p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-stone-900">{t("playbook7Title")}</h3>
          <p className="mt-1 text-sm text-stone-600">{t("playbook7Subtitle")}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-950">{t("playbookTargetsTitle")}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-stone-800">
            <li>{t("playbookT1")}</li>
            <li>{t("playbookT2")}</li>
            <li>{t("playbookT3")}</li>
            <li>{t("playbookT4")}</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-950">
            {t("playbookRoutineTitle")} · {t("playbookRoutineTime")}
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-3 text-sm text-stone-800">
            <li>
              <span className="font-medium text-stone-900">{t("playbookR1Title")}</span>
              <p className="mt-1 pl-0 text-stone-700 sm:pl-0">{t("playbookR1Body")}</p>
              <ul className="mt-1 list-inside list-disc text-stone-600">
                <li>{t("playbookR1a")}</li>
                <li>{t("playbookR1b")}</li>
                <li>{t("playbookR1c", { n: hotListingsCount })}</li>
              </ul>
            </li>
            <li>
              <span className="font-medium text-stone-900">{t("playbookR2Title")}</span>
              <p className="mt-1 text-stone-700">{t("playbookR2Body")}</p>
              <pre className="mt-2 max-w-full overflow-x-auto rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {t("playbookR2Template")}
              </pre>
              <div className="mt-2">
                <G4DailyLogCopy
                  line={t("playbookR2Template")}
                  copyLabel={t("g4CopyLog")}
                  copiedLabel={t("g4Copied")}
                />
              </div>
            </li>
            <li>
              <span className="font-medium text-stone-900">{t("playbookR3Title")}</span>
              <p className="mt-1 text-stone-700">{t("playbookR3Body")}</p>
            </li>
            <li>
              <span className="font-medium text-stone-900">{t("playbookR4Title")}</span>
              <pre className="mt-2 max-w-full overflow-x-auto rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800 [overflow-wrap:anywhere] whitespace-pre-wrap">
                {t("playbookR4Template")}
              </pre>
              <div className="mt-2">
                <G4DailyLogCopy
                  line={t("playbookR4Template")}
                  copyLabel={t("g4CopyLog")}
                  copiedLabel={t("g4Copied")}
                />
              </div>
            </li>
            <li>
              <span className="font-medium text-stone-900">{t("playbookR5Title")}</span>
              <p className="mt-1 text-stone-700">{t("playbookR5Body")}</p>
            </li>
          </ol>
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-950">{t("playbookWeeklyTitle")}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-stone-800">
            <li>{t("playbookWeeklyA")}</li>
            <li>{t("playbookWeeklyB", { n: G5_EXPAND_MIN_LISTINGS })}</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-950">{t("playbookReportTitle")}</p>
          <p className="mt-1 text-xs text-stone-600">{t("playbookReportHint")}</p>
          <pre className="mt-2 max-w-full overflow-x-auto rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800 [overflow-wrap:anywhere] whitespace-pre-wrap">
            {playbookReportSnapshot}
          </pre>
          <div className="mt-2">
            <G4DailyLogCopy
              line={playbookReportSnapshot}
              copyLabel={t("g4CopyLog")}
              copiedLabel={t("g4Copied")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-stone-900">{t("g4SectionTitle")}</h3>
          <p className="mt-1 text-sm text-stone-600">{t("g4SectionIntro")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { k: t("g4DailyNewListings"), v: g4Daily.newListings },
            { k: t("g4DailyWa"), v: g4Daily.wa },
            { k: t("g4DailyCalls"), v: g4Daily.calls },
            { k: t("g4DailyF1Req"), v: g4Daily.f1Requests },
            { k: t("g4DailyF1Ok"), v: g4Daily.f1Confirmed },
          ].map((row) => (
            <div
              key={row.k}
              className="rounded-xl border border-emerald-100 bg-white/90 p-3 text-center shadow-sm"
            >
              <p className="text-xs font-medium text-stone-500">{row.k}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-950" dir="ltr">
                {row.v.toLocaleString(numberLoc)}
              </p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium text-stone-600">{t("g4LogLineLabel")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <pre className="max-w-full grow overflow-x-auto rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800 [overflow-wrap:anywhere]">
              {g4LogText}
            </pre>
            <G4DailyLogCopy
              line={g4LogText}
              copyLabel={t("g4CopyLog")}
              copiedLabel={t("g4Copied")}
            />
          </div>
          <p className="mt-2 text-xs text-stone-500">{t("g4LeadEventsNote")}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white/90 p-4">
            <p className="text-sm font-semibold text-stone-900">{t("g4TopCategory")}</p>
            <p className="mt-1 text-sm text-stone-700">
              {t("g4TopCategoryBody", {
                name: g4TopCategoryLabel,
                n: g4TopCat.whatsappClicks,
              })}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white/90 p-4">
            <p className="text-sm font-semibold text-stone-900">{t("g4TopCity")}</p>
            <p className="mt-1 text-sm text-stone-700">
              {g4TopCity.city
                ? t("g4TopCityBody", {
                    city: g4TopCity.cityAr || g4TopCity.city,
                    score: g4TopCity.score,
                  })
                : t("growthEmpty")}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">{t("g4TargetsTitle")}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
            <li>
              {t("g4TargetsW1", { n: G4_WEEKLY_TARGETS[0] })}
            </li>
            <li>
              {t("g4TargetsW2", { n: G4_WEEKLY_TARGETS[1] })}
            </li>
            <li>
              {t("g4TargetsW3", { n: G4_WEEKLY_TARGETS[2] })}
            </li>
            <li className="font-medium text-emerald-900">
              {t("g4TargetsRolling", { n: g4NewWeek })}
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-stone-900">{t("g4WeakTitle")}</h4>
          {g4Weak.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">{t("g4WeakEmpty")}</p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-xl border border-amber-200/80 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-3 py-2">{t("g4WeakColListing")}</th>
                    <th className="px-3 py-2">{t("g4WeakColCity")}</th>
                    <th className="px-3 py-2">{t("g4WeakColViews")}</th>
                    <th className="px-3 py-2">{t("g4WeakColLeads")}</th>
                    <th className="px-3 py-2">{t("g4WeakColDirect")}</th>
                  </tr>
                </thead>
                <tbody>
                  {g4Weak.map((l) => (
                    <tr key={l.id} className="border-t border-stone-100">
                      <td className="px-3 py-2">
                        <Link
                          href={`/listing/${l.id}`}
                          className="font-medium text-emerald-800 underline [overflow-wrap:anywhere]"
                        >
                          {l.titleAr}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-stone-700">{l.city}</td>
                      <td className="px-3 py-2 tabular-nums" dir="ltr">
                        {l.views.toLocaleString(numberLoc)}
                      </td>
                      <td className="px-3 py-2 tabular-nums" dir="ltr">
                        {(l.wa + l.phone).toLocaleString(numberLoc)}
                      </td>
                      <td className="px-3 py-2">{l.isDirect ? t("g4Yes") : t("g4No")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-stone-600">{t("g4WeakHint")}</p>
        </div>
        <p className="text-xs text-stone-500">{t("g4Principles")}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-violet-200/80 bg-violet-50/50 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">{t("g5SectionTitle")}</h3>
        <p className="text-sm text-stone-600">{t("g5SectionIntro")}</p>
        <div className="rounded-xl border border-violet-100 bg-white/90 p-4 text-sm text-stone-800">
          <p className="font-semibold text-violet-950">{t("g5WinnersTitle")}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
            <li>
              {t("g5TopCityLine", {
                name: g5CityLabel,
                n: g5TopCity.whatsappClicks,
              })}
            </li>
            <li>
              {t("g5TopCategoryLine", {
                name: g4TopCategoryLabel,
                n: g4TopCat.whatsappClicks,
              })}
            </li>
          </ul>
        </div>
        <ul className="list-inside list-decimal space-y-2 text-sm text-stone-700">
          <li>{t("g5Checklist48h")}</li>
          <li>{t("g5Outreach")}</li>
          <li>{t("g5LocalConversion")}</li>
        </ul>
        {g5CityKey ? (
          <div className="rounded-xl border border-stone-200 bg-white/90 p-3 text-sm text-stone-800">
            <p className="font-medium text-stone-900">{t("g5InCityStatsTitle", { city: g5CityLabel })}</p>
            <ul className="mt-2 space-y-1 text-stone-700">
              <li>
                {t("g5StatListings", { n: g5CityStats.listings, min: G5_EXPAND_MIN_LISTINGS })}
              </li>
              <li>
                {t("g5StatDirect", {
                  pct:
                    g5CityStats.total > 0
                      ? Math.round((100 * g5CityStats.direct) / g5CityStats.total)
                      : 0,
                })}
              </li>
              <li>{t("g5StatDailyWa", { n: g4Daily.wa })}</li>
            </ul>
            <p
              className={`mt-2 text-sm font-medium ${g5ExpandReady ? "text-emerald-800" : "text-amber-900"}`}
            >
              {g5ExpandReady ? t("g5ExpandYes") : t("g5ExpandNotYet")}
            </p>
          </div>
        ) : null}
        <p className="text-xs text-stone-500">{t("g5Footnote")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthCardListingsCreated")}</p>
          <p className="mt-1 text-2xl font-semibold">{listingsCreated}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthCardActiveListings")}</p>
          <p className="mt-1 text-2xl font-semibold">{activeListings}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthCardInquiries")}</p>
          <p className="mt-1 text-2xl font-semibold">{inquiriesCount}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthCardBookings")}</p>
          <p className="mt-1 text-2xl font-semibold">{bookingsCount}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthFunnelHomepage")}</p>
          <p className="mt-1 text-xl font-semibold">{homes}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthFunnelSearch")}</p>
          <p className="mt-1 text-xl font-semibold">{searches}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-stone-500">{t("growthFunnelListingViews")}</p>
          <p className="mt-1 text-xl font-semibold">{listingViews}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">{t("growthRevenueTitle")}</h3>
        <ul className="mt-3 space-y-2 text-sm text-stone-700">
          <li>
            {t("growthRevFeatured")}: {money(revenue.featuredListingRevenue, defaultCurrency)}
          </li>
          <li>
            {t("growthRevBnhubGross")}: {money(revenue.bnhubBookingGross, defaultCurrency)}
          </li>
          <li>
            {t("growthRevBnhubFees")}: {money(revenue.bnhubPlatformFees, defaultCurrency)}
          </li>
          <li className="text-xs text-stone-500">{t("growthRevVerifiedNote")}</li>
          {revenue.verifiedByCurrency.map((row) => (
            <li key={row.currency}>
              {t("growthRevVerifiedTotal", { currency: row.currency })}:{" "}
              {money(row._sum.amount ?? 0, row.currency)}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t("growthTopCampaigns")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {topCampaigns.length === 0 ? (
              <li className="text-stone-500">{t("growthEmpty")}</li>
            ) : (
              topCampaigns.map((c) => (
                <li key={String(c.campaign)} className="flex justify-between gap-2">
                  <span className="truncate">{c.campaign ?? "—"}</span>
                  <span className="font-medium">{c.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t("growthTopListingsViews")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {topViews.length === 0 ? (
              <li className="text-stone-500">{t("growthEmpty")}</li>
            ) : (
              topViews.map((v) => {
                const meta = titleMap.get(v.propertyId);
                return (
                  <li key={v.propertyId} className="flex justify-between gap-2">
                    <span className="truncate">{meta ? `${meta.titleAr} (${meta.city})` : v.propertyId}</span>
                    <span className="font-medium">{v.views}</span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t("growthLeadsBySource")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {leadSources.map((r) => (
              <li key={String(r.source)} className="flex justify-between gap-2">
                <span>{r.source ?? t("growthSourceDirect")}</span>
                <span className="font-medium">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">{t("growthBookingsBySource")}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {bookingSources.map((r) => (
              <li key={String(r.source)} className="flex justify-between gap-2">
                <span>{r.source ?? t("growthSourceDirect")}</span>
                <span className="font-medium">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">{t("growthEventCounts")}</h3>
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-stone-50 p-3 text-xs text-stone-800">
          {JSON.stringify(eventCounts, null, 2)}
        </pre>
      </div>
    </div>
  );
}
