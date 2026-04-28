import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  SYBNB78_FETCH_DEFAULT_DELAYS_MS,
  SYBNB78_FETCH_DEFAULT_RETRIES,
} from "@/lib/sybnb/sybnb-low-connectivity-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("lowConnectivityPageTitle"),
    description: t("lowConnectivitySubtitle"),
  };
}

export default async function AdminSybnbLowConnectivityPage() {
  const t = await getTranslations("Admin");
  const delays = SYBNB78_FETCH_DEFAULT_DELAYS_MS.join(" · ");

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("lowConnectivityKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("lowConnectivityTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("lowConnectivitySubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("lowConnectivitySkeletonTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">{t("lowConnectivitySkeletonBody")}</p>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("lowConnectivityRetryTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-950/95">
          {t("lowConnectivityRetryBody", {
            retries: SYBNB78_FETCH_DEFAULT_RETRIES + 1,
            delays,
          })}
        </p>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-950">{t("lowConnectivityCacheTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-indigo-950/95">{t("lowConnectivityCacheBody")}</p>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("lowConnectivityNavigationTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-violet-950/95">{t("lowConnectivityNavigationBody")}</p>
      </section>

      <section className="rounded-2xl border border-stone-900 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("lowConnectivitySuccessTitle")}</h2>
        <p className="mt-3 text-sm text-stone-200">{t("lowConnectivitySuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-400">
          <Link href="/admin/sybnb/page-weight" className="text-amber-200 underline-offset-2 hover:underline">
            {t("lowConnectivityLinkPageWeight")}
          </Link>
        </p>
      </section>
    </div>
  );
}
