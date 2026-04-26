import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HadiahLogo } from "@/components/brand/HadiahLogo";
import { getHadiahBrandLockup } from "@/lib/brand/darlink-copy";
import { isBnhubInSyriaUI } from "@/lib/platform-flags";

/** Hadiah Link footer — operational copy from i18n. */
export async function SyriaFooter() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();
  const lock = getHadiahBrandLockup(locale);
  const showBnhub = isBnhubInSyriaUI();

  return (
    <footer className="mt-auto border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-navy)] text-[color:var(--darlink-off-white)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex max-w-sm items-center gap-3">
              <HadiahLogo variant="on-dark" className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
              <div className="min-w-0 text-start">
                <span className="block truncate text-sm font-bold text-white sm:text-base">{lock.primary}</span>
                <span
                  className="mt-0.5 block truncate text-xs text-white/75 sm:text-sm"
                  dir={lock.secondaryDir}
                >
                  {lock.secondary}
                </span>
              </div>
            </div>
            <p className="mt-5 text-lg font-semibold text-white">{t("headline")}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">{t("body")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--darlink-sand)]">{t("colExplore")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/buy" className="text-white/85 transition hover:text-white">
                  {t("linkBuy")}
                </Link>
              </li>
              <li>
                <Link href="/rent" className="text-white/85 transition hover:text-white">
                  {t("linkRent")}
                </Link>
              </li>
              {showBnhub ? (
                <li>
                  <Link href="/bnhub/stays" className="text-white/85 transition hover:text-white">
                    {t("linkStays")}
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/sell" className="font-medium text-[color:var(--darlink-sand)] transition hover:text-white">
                  {t("linkSell")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--darlink-sand)]">{t("colAccount")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-white/85 transition hover:text-white">
                  {t("linkSignIn")}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white/85 transition hover:text-white">
                  {t("linkDashboard")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-8 text-xs text-white/50">{t("finePrint")}</p>
      </div>
    </footer>
  );
}
