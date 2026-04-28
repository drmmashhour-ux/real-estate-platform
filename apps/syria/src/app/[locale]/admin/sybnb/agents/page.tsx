import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSybnbAgentListingUsdBand } from "@/lib/sybnb/sybnb-agent-incentives";
import { getSybnbAgentLeaderboard } from "@/lib/sybnb/sybnb-agent-leaderboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("sybnbAgentsPageTitle"),
    description: t("sybnbAgentsPageSubtitle"),
  };
}

function fmtInt(n: number, locale: string) {
  return n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US");
}

export default async function AdminSybnbAgentsPage() {
  const t = await getTranslations("Admin");
  const locale = await getLocale();
  const usd = getSybnbAgentListingUsdBand();
  const leaderboard = await getSybnbAgentLeaderboard({ windowDays: 7, limit: 30 });

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/90">{t("sybnbAgentsKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("sybnbAgentsPageTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("sybnbAgentsPageSubtitle")}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">{t("sybnbAgentsRewardTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-stone-700">
            <li>{t("sybnbAgentsRewardListingUsd", { min: String(usd.min), max: String(usd.max) })}</li>
            <li>{t("sybnbAgentsRewardBookingLater")}</li>
          </ul>
          <p className="mt-4 text-xs text-stone-500">{t("sybnbAgentsManualPay")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-950">{t("sybnbAgentsTrackTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-emerald-950/95">
            <li>{t("sybnbAgentsTrackListings")}</li>
            <li>{t("sybnbAgentsTrackBookings")}</li>
          </ul>
          <p className="mt-4 text-xs text-emerald-900/80">{t("sybnbAgentsAttributionHint")}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">{t("sybnbAgentsLeaderboardSection")}</h2>
        <p className="text-xs text-stone-500">{t("sybnbAgentsLeaderboardHint")}</p>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-[560px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-600">
                <th className="px-4 py-3">{t("sybnbAgentsColRank")}</th>
                <th className="px-4 py-3">{t("sybnbAgentsColAgent")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbAgentsColListings7d")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbAgentsColBookings7d")}</th>
                <th className="px-4 py-3 tabular-nums">{t("sybnbAgentsColScore")}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-stone-500">
                    {t("sybnbAgentsLeaderboardEmpty")}
                  </td>
                </tr>
              ) : (
                leaderboard.map((row, i) => (
                  <tr key={row.agentUserId} className="border-b border-stone-100 odd:bg-white even:bg-stone-50/40">
                    <td className="px-4 py-2.5 font-semibold text-stone-900">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-stone-900">{row.displayName}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.listingsWindow, locale)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-800">{fmtInt(row.bookingsWindow, locale)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-stone-600">{fmtInt(row.score, locale)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("sybnbAgentsVisibilityTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("sybnbAgentsVisibilityBody")}</p>
      </section>

      <p className="text-center text-xs text-stone-500">
        <Link href="/admin/listings" className="font-medium text-amber-900 underline-offset-2 hover:underline">
          {t("sybnbAgentsBackListings")}
        </Link>
      </p>
    </div>
  );
}
