import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SYBNB77_BROWSE_CARD_IMAGE_MAX } from "@/lib/sybnb/sybnb-page-weight-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("pageWeightPageTitle"),
    description: t("pageWeightSubtitle"),
  };
}

export default async function AdminSybnbPageWeightPage() {
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("pageWeightKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("pageWeightTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("pageWeightSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("pageWeightLibsTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("pageWeightLibs1")}</li>
          <li>{t("pageWeightLibs2")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("pageWeightRscTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-emerald-950/95">
          <li>{t("pageWeightRsc1")}</li>
          <li>{t("pageWeightRsc2")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-950">{t("pageWeightDataTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-indigo-950/95">{t("pageWeightDataBody", { n: SYBNB77_BROWSE_CARD_IMAGE_MAX })}</p>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-indigo-950/95">
          <li>{t("pageWeightDataPoint1")}</li>
          <li>{t("pageWeightDataPoint2")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("pageWeightFetchTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-violet-950/95">{t("pageWeightFetchBody")}</p>
      </section>

      <section className="rounded-2xl border border-stone-900 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("pageWeightSuccessTitle")}</h2>
        <p className="mt-3 text-sm text-stone-200">{t("pageWeightSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-400">
          <Link href="/admin/sybnb/market-domination" className="text-amber-200 underline-offset-2 hover:underline">
            {t("pageWeightLinkMarket")}
          </Link>
        </p>
      </section>
    </div>
  );
}
