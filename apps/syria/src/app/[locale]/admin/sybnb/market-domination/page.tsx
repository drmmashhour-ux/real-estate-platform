import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  SYBNB75_PRIORITY_CITY_IDS,
  SYBNB75_HOTEL_VISIBLE_SHARE_MIN_PCT,
  SYBNB75_HOTEL_VISIBLE_SHARE_MAX_PCT,
  type Sybnb75CityId,
} from "@/lib/sybnb/sybnb-market-domination-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("marketDominationPageTitle"),
    description: t("marketDominationSubtitle"),
  };
}

function cityClasses(id: Sybnb75CityId): string {
  switch (id) {
    case "damascus":
      return "border-rose-200 bg-rose-50/80";
    case "latakia":
      return "border-cyan-200 bg-cyan-50/80";
    case "aleppo":
      return "border-amber-200 bg-amber-50/80";
    default:
      return "border-stone-200 bg-stone-50/80";
  }
}

function cityTitle(
  t: Awaited<ReturnType<typeof getTranslations>>,
  id: Sybnb75CityId,
): string {
  switch (id) {
    case "damascus":
      return t("marketDominationCityDamascusTitle");
    case "latakia":
      return t("marketDominationCityLatakiaTitle");
    case "aleppo":
      return t("marketDominationCityAleppoTitle");
    default:
      return "";
  }
}

function cityBody(t: Awaited<ReturnType<typeof getTranslations>>, id: Sybnb75CityId): string {
  switch (id) {
    case "damascus":
      return t("marketDominationCityDamascusBody");
    case "latakia":
      return t("marketDominationCityLatakiaBody");
    case "aleppo":
      return t("marketDominationCityAleppoBody");
    default:
      return "";
  }
}

export default async function AdminSybnbMarketDominationPage() {
  const t = await getTranslations("Admin");

  const competitorEdges = [
    t("marketDominationEdgeSpeed"),
    t("marketDominationEdgeSimplicity"),
    t("marketDominationEdgeTrust"),
    t("marketDominationEdgeLocal"),
  ];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("marketDominationKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("marketDominationTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("marketDominationSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("marketDominationCitiesTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("marketDominationCitiesLead")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SYBNB75_PRIORITY_CITY_IDS.map((id) => (
            <div key={id} className={`rounded-xl border p-4 ${cityClasses(id)}`}>
              <h3 className="text-sm font-semibold text-stone-900">{cityTitle(t, id)}</h3>
              <p className="mt-2 text-sm text-stone-800">{cityBody(t, id)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-950">{t("marketDominationSupplyTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-indigo-950/95">
          {t("marketDominationSupplyBody", {
            min: SYBNB75_HOTEL_VISIBLE_SHARE_MIN_PCT,
            max: SYBNB75_HOTEL_VISIBLE_SHARE_MAX_PCT,
          })}
        </p>
        <p className="mt-3 text-xs text-indigo-900/80">{t("marketDominationSupplyFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("marketDominationMoatTitle")}</h2>
        <p className="mt-2 text-sm text-emerald-950/90">{t("marketDominationMoatLead")}</p>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-emerald-950/95">
          <li>{t("marketDominationMoatWhatsapp")}</li>
          <li>{t("marketDominationMoatSupport")}</li>
          <li>{t("marketDominationMoatHuman")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("marketDominationHabitTitle")}</h2>
        <blockquote className="mt-4 rounded-xl border border-violet-200 bg-white/90 px-5 py-4 text-lg font-medium leading-relaxed text-violet-950 shadow-inner">
          {t("marketDominationHabitQuote")}
        </blockquote>
        <p className="mt-3 text-xs text-violet-900/85">{t("marketDominationHabitFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("marketDominationCompetitorTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("marketDominationCompetitorLead")}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {competitorEdges.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2 rounded-xl border border-stone-100 bg-stone-50/90 px-4 py-3 text-sm text-stone-800">
              <span className="text-amber-600" aria-hidden>
                ◆
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-900 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("marketDominationSuccessTitle")}</h2>
        <p className="mt-3 text-sm text-stone-200">{t("marketDominationSuccessBody")}</p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-400">
          <li>
            <Link href="/admin/sybnb/hotels" className="text-amber-200 underline-offset-2 hover:underline">
              {t("marketDominationLinkHotels")}
            </Link>
          </li>
          <li>
            <Link href="/admin/sybnb/hotel-retention" className="text-amber-200 underline-offset-2 hover:underline">
              {t("marketDominationLinkRetention")}
            </Link>
          </li>
          <li>
            <Link href="/admin/sybnb/flywheel" className="text-amber-200 underline-offset-2 hover:underline">
              {t("marketDominationLinkFlywheel")}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
