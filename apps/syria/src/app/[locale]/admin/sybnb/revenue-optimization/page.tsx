import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("revOptPageTitle"),
    description: t("revOptSubtitle"),
  };
}

export default async function AdminSybnbRevenueOptimizationPage() {
  const t = await getTranslations("Admin");

  const upsellItems = [t("revOptUpsell1"), t("revOptUpsell2")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("revOptKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("revOptTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("revOptSubtitle")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">{t("revOptFeaturedSectionTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-950">{t("revOptTierFeaturedTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-emerald-950/95">{t("revOptTierFeaturedBody")}</p>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-violet-950">{t("revOptTierPremiumTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-violet-950/95">{t("revOptTierPremiumBody")}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("revOptPricingSectionTitle")}</h2>
        <ul className="space-y-4 text-sm leading-relaxed text-stone-800">
          <li className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3">{t("revOptPricingFeatured")}</li>
          <li className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3">{t("revOptPricingPremium")}</li>
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-sky-950">{t("revOptUpsellSectionTitle")}</h2>
        <p className="text-sm font-medium text-sky-950/90">{t("revOptUpsellLead")}</p>
        <ul className="space-y-3 text-sm leading-relaxed text-sky-950/95">
          {upsellItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-sky-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("revOptBundleSectionTitle")}</h2>
        <p className="text-sm leading-relaxed text-stone-700">{t("revOptBundleLead")}</p>
        <blockquote className="rounded-xl border border-amber-200/80 bg-white/90 px-5 py-4 text-lg leading-relaxed text-stone-900 shadow-inner">
          {t("revOptBundleQuote")}
        </blockquote>
        <p className="text-xs leading-relaxed text-stone-600">{t("revOptBundleGloss")}</p>
      </section>

      <section className="rounded-2xl border border-stone-300 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("revOptSupplySectionTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-100">{t("revOptSupplyBody")}</p>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("revOptSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("revOptSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("revOptFooterNote")}</p>
      </section>
    </div>
  );
}
