"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** BNHUB city query values — match listing `city` field where possible. */
const SHORTCUTS = [
  { city: "Montreal", labelKey: "cityMontreal" as const },
  { city: "Laval", labelKey: "cityLaval" as const },
  { city: "Toronto", labelKey: "cityToronto" as const },
];

function staysHref(city: string) {
  const p = new URLSearchParams();
  p.set("city", city);
  p.set("mapLayout", "map");
  return `/bnhub/stays?${p.toString()}`;
}

/** Fast path: search → stays map with city prefilled (minimal copy, high intent). */
export function HomeExploreCityShortcuts() {
  const t = useTranslations("home");

  return (
    <div className="mt-5 text-center">
      <p className="text-sm text-slate-500 md:text-[15px]">
        <span className="mr-1.5 inline-block select-none" aria-hidden>
          👉
        </span>
        <span className="text-slate-400">{t("exploreStaysLead")}</span>
      </p>
      <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm md:text-[15px]">
        {SHORTCUTS.map((s, i) => (
          <span key={s.city} className="inline-flex items-center gap-x-2">
            {i > 0 ? (
              <span className="text-slate-600" aria-hidden>
                ·
              </span>
            ) : null}
            <Link
              href={staysHref(s.city)}
              className="font-semibold text-[#D4AF37] underline-offset-2 transition hover:text-[#e8c84a] hover:underline"
            >
              {t(s.labelKey)}
            </Link>
          </span>
        ))}
        <span className="text-slate-600" aria-hidden>
          …
        </span>
        <Link
          href="/bnhub/stays"
          className="ml-0.5 font-medium text-slate-500 underline-offset-2 hover:text-[#D4AF37] hover:underline"
        >
          {t("exploreStaysAll")}
        </Link>
      </p>
    </div>
  );
}
