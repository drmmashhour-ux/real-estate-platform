import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
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

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

export default async function AdminGrowthPage() {
  const t = await getTranslations("Admin");
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
  ]);

  const listingViews = eventCounts["listing_view"] ?? 0;
  const searches = eventCounts["search_performed"] ?? 0;
  const homes = eventCounts["homepage_view"] ?? 0;

  const propertiesByView = await prisma.syriaProperty.findMany({
    where: { id: { in: topViews.map((x) => x.propertyId) } },
    select: { id: true, titleAr: true, city: true },
  });
  const titleMap = new Map(propertiesByView.map((p) => [p.id, p]));

  const defaultCurrency = revenue.verifiedByCurrency[0]?.currency ?? SYRIA_PRICING.currency;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t("growthTitle")}</h2>
        <p className="text-sm text-stone-600">{t("growthIntro", { days: 30 })}</p>
        <p className="mt-2 text-xs text-stone-500">
          {t("growthAutonomyMode", { mode: getSyriaAutonomyMode() })}
        </p>
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
