import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getSybnbPerformanceCitySnapshot,
  getSybnbPerformanceDailySeries,
  getSybnbPerformanceListingLeaderboard,
} from "@/lib/sybnb/sybnb-performance-metrics";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("sybnbPerformanceTitle"),
    description: t("sybnbPerformanceSubtitle"),
  };
}

function fmtInt(n: number, locale: string) {
  return n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US");
}

function fmtPct(n: number | null, locale: string) {
  if (n == null) return "—";
  return `${n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

export default async function AdminSybnbPerformancePage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();

  const [daily, cities, listings] = await Promise.all([
    getSybnbPerformanceDailySeries(locale, 14),
    getSybnbPerformanceCitySnapshot(30),
    getSybnbPerformanceListingLeaderboard(15),
  ]);

  const citiesByViews = [...cities].sort((a, b) => b.listingViews - a.listingViews).slice(0, 20);
  const citiesByConversion = [...cities]
    .filter((c) => c.listingViews >= 15)
    .sort((a, b) => (b.conversionRequestsPerViewPct ?? 0) - (a.conversionRequestsPerViewPct ?? 0))
    .slice(0, 12);

  const weeklyQuestions = [
    t("sybnbPerformanceWeeklyQ1"),
    t("sybnbPerformanceWeeklyQ2"),
    t("sybnbPerformanceWeeklyQ3"),
  ];
  const rules = [
    t("sybnbPerformanceRule1"),
    t("sybnbPerformanceRule2"),
    t("sybnbPerformanceRule3"),
  ];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("sybnbPerformanceKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("sybnbPerformanceTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("sybnbPerformanceSubtitle")}</p>
        <p className="mt-3 text-xs text-stone-500">{t("sybnbPerformanceFootnote")}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbPerformanceDailySection")}</h2>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-[720px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">
                <th className="px-4 py-3">{t("sybnbPerformanceColDay")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceColNewListings")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceColConversations")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceColBookingRequests")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceColSuccessfulBookings")}</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row) => (
                <tr key={row.dayKey} className="border-b border-stone-100 odd:bg-white even:bg-stone-50/40">
                  <td className="px-4 py-2.5 font-medium text-stone-900">{row.label}</td>
                  <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.newStayListings, locale)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.conversationsStarted, locale)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.bookingRequests, locale)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.successfulBookings, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">{t("sybnbPerformanceCityTopClicks")}</h2>
          <p className="text-xs text-stone-500">{t("sybnbPerformanceCityTopClicksHint")}</p>
          <CityTable rows={citiesByViews} locale={locale} t={t} />
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">{t("sybnbPerformanceCityBestConversion")}</h2>
          <p className="text-xs text-stone-500">{t("sybnbPerformanceCityBestConversionHint")}</p>
          {citiesByConversion.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-sm text-stone-600">
              {t("sybnbPerformanceCityConversionEmpty")}
            </p>
          ) : (
            <CityTable rows={citiesByConversion} locale={locale} t={t} compact />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbPerformanceListingSection")}</h2>
        <p className="text-xs text-stone-500">{t("sybnbPerformanceListingHint")}</p>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-[760px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">
                <th className="px-4 py-3">{t("sybnbPerformanceListingColTitle")}</th>
                <th className="px-4 py-3">{t("sybnbPerformanceListingColCity")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceListingColViews")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceListingColMessages")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceListingColPhoneReveals")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbPerformanceListingColBookings")}</th>
                <th className="px-4 py-3">{t("sybnbPerformanceListingColLink")}</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                    {t("sybnbPerformanceListingEmpty")}
                  </td>
                </tr>
              ) : (
                listings.map((row) => (
                  <tr key={row.listingId} className="border-b border-stone-100 odd:bg-white even:bg-stone-50/40">
                    <td className="max-w-[220px] truncate px-4 py-2.5 font-medium text-stone-900" title={row.titleAr}>
                      {row.titleAr}
                    </td>
                    <td className="px-4 py-2.5 text-stone-700">{row.city}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.views, locale)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.messages, locale)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.phoneReveals, locale)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.bookingsCreated, locale)}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/listing/${row.listingId}`}
                        className="text-xs font-semibold text-amber-900 underline-offset-2 hover:underline"
                      >
                        {t("sybnbPerformanceListingOpen")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-950">{t("sybnbPerformanceWeeklySection")}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-emerald-950/95">
            {weeklyQuestions.map((line) => (
              <li key={line.slice(0, 48)} className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  •
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6 text-stone-50 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-200">{t("sybnbPerformanceRulesSection")}</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-100">
            {rules.map((line) => (
              <li key={line.slice(0, 48)} className="border-l-2 border-amber-400/80 ps-3">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("sybnbPerformanceSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("sybnbPerformanceSuccessBody")}</p>
      </section>

      <p className="text-center text-xs text-stone-500">
        <Link href="/admin/sybnb/analytics" className="font-medium text-amber-900 underline-offset-2 hover:underline">
          {t("sybnbPerformanceBackAnalytics")}
        </Link>
      </p>
    </div>
  );
}

function CityTable({
  rows,
  locale,
  compact,
  t,
}: {
  rows: Awaited<ReturnType<typeof getSybnbPerformanceCitySnapshot>>;
  locale: string;
  compact?: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className={`min-w-[520px] w-full border-collapse text-sm ${compact ? "text-xs" : ""}`}>
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">
            <th className="px-3 py-2.5">{t("sybnbPerformanceCityColCity")}</th>
            <th className="px-3 py-2.5 tabular-nums">{t("sybnbPerformanceCityColViews")}</th>
            {!compact ? <th className="px-3 py-2.5 tabular-nums">{t("sybnbPerformanceCityColContacts")}</th> : null}
            <th className="px-3 py-2.5 tabular-nums">{t("sybnbPerformanceCityColRequests")}</th>
            <th className="px-3 py-2.5 tabular-nums">{t("sybnbPerformanceCityColConv")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.city} className="border-b border-stone-100 odd:bg-white even:bg-stone-50/40">
              <td className="px-3 py-2 font-medium text-stone-900">{row.city}</td>
              <td className="px-3 py-2 tabular-nums text-stone-800">{fmtInt(row.listingViews, locale)}</td>
              {!compact ? (
                <td className="px-3 py-2 tabular-nums text-stone-800">{fmtInt(row.contactClicks, locale)}</td>
              ) : null}
              <td className="px-3 py-2 tabular-nums text-stone-800">{fmtInt(row.bookingRequests, locale)}</td>
              <td className="px-3 py-2 tabular-nums text-stone-800">{fmtPct(row.conversionRequestsPerViewPct, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
