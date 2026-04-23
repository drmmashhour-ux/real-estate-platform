import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DarlinkWordmark } from "@/components/brand/DarlinkWordmark";

/** Darlink footer — operational copy from i18n; product name aligned with darlink-copy. */
export async function SyriaFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-auto border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-navy)] text-[color:var(--darlink-off-white)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <DarlinkWordmark variant="on-dark" className="h-10 w-auto max-w-[min(100%,320px)] sm:h-11" />
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
              <li>
                <Link href="/bnhub/stays" className="text-white/85 transition hover:text-white">
                  {t("linkStays")}
                </Link>
              </li>
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
