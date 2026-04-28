import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const FOCUS = [
  { cityEn: "Damascus", govEn: "Damascus", labelKey: "cityFocusDamascus" as const },
  { cityEn: "Latakia", govEn: "Latakia", labelKey: "cityFocusLatakia" as const },
];

/** SYBNB-19 — High-demand cities shortcut row above browse filters. */
export async function SybnbCityFocusChips() {
  const t = await getTranslations("Sybnb.home");

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/70 px-4 py-4 [dir=rtl]:text-right">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("cityFocusTitle")}</p>
      <p className="mt-1 text-xs text-neutral-600">{t("cityFocusSubtitle")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FOCUS.map((row) => {
          const qs = new URLSearchParams({
            category: "stay",
            governorate: row.govEn,
            city: row.cityEn,
          });
          return (
            <Link
              key={row.cityEn}
              href={`/sybnb?${qs.toString()}`}
              className="inline-flex min-h-11 items-center rounded-full border border-amber-300/80 bg-white px-5 py-2 text-sm font-bold text-amber-950 shadow-sm ring-1 ring-amber-200/50 transition hover:bg-amber-50 hover:ring-amber-300"
            >
              {t(row.labelKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
