import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("expReadyPageTitle"),
    description: t("expReadySubtitle"),
  };
}

export default async function AdminSybnbExpansionReadinessPage() {
  const t = await getTranslations("Admin");

  const standardItems = [t("expReadyStandardize1"), t("expReadyStandardize2"), t("expReadyStandardize3")];
  const localeItems = [t("expReadyLocale1"), t("expReadyLocale2")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("expReadyKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("expReadyTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("expReadySubtitle")}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("expReadyStandardizeSectionTitle")}</h2>
        <p className="text-sm font-medium text-violet-950/90">{t("expReadyStandardizeLead")}</p>
        <ul className="space-y-3 text-sm leading-relaxed text-violet-950/95">
          {standardItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-violet-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("expReadyLocaleSectionTitle")}</h2>
        <p className="text-sm font-medium text-emerald-950/90">{t("expReadyLocaleLead")}</p>
        <ul className="space-y-3 text-sm leading-relaxed text-emerald-950/95">
          {localeItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-sky-950">{t("expReadyDuplicateSectionTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-sky-950/95">{t("expReadyDuplicateBody")}</p>
      </section>

      <section className="rounded-2xl border border-stone-300 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("expReadyModularSectionTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-100">{t("expReadyModularBody")}</p>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("expReadySuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("expReadySuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("expReadyFooterNote")}</p>
      </section>
    </div>
  );
}
