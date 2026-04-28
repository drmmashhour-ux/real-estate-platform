import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("flywheelPageTitle"),
    description: t("flywheelSubtitle"),
  };
}

export default async function AdminSybnbFlywheelPage() {
  const t = await getTranslations("Admin");

  const loopSteps = [
    t("flywheelLoopListings"),
    t("flywheelLoopUsers"),
    t("flywheelLoopConversations"),
    t("flywheelLoopBookings"),
    t("flywheelLoopTrust"),
    t("flywheelLoopMoreListings"),
  ];

  const strengthenItems = [t("flywheelStrengthen1"), t("flywheelStrengthen2"), t("flywheelStrengthen3")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("flywheelKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("flywheelTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("flywheelSubtitle")}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("flywheelLoopSectionTitle")}</h2>
        <div
          dir="ltr"
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-center text-sm font-medium text-violet-950"
        >
          {loopSteps.map((label, i) => (
            <Fragment key={label}>
              {i > 0 ? (
                <span className="select-none text-violet-400" aria-hidden>
                  →
                </span>
              ) : null}
              <span className="rounded-full border border-violet-200 bg-white px-4 py-2 shadow-sm">{label}</span>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("flywheelStrengthenSectionTitle")}</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-emerald-950/95">
          {strengthenItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("flywheelRetainSectionTitle")}</h2>
        <p className="text-sm leading-relaxed text-stone-700">{t("flywheelRetainLead")}</p>
        <blockquote className="rounded-xl border border-amber-200/80 bg-white/90 px-5 py-4 text-lg leading-relaxed text-stone-900 shadow-inner">
          {t("flywheelRetainQuote")}
        </blockquote>
        <p className="text-xs leading-relaxed text-stone-600">{t("flywheelRetainGloss")}</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("flywheelRepeatSectionTitle")}</h2>
        <ul className="space-y-4 text-sm leading-relaxed text-stone-700">
          <li>{t("flywheelRepeatDaily")}</li>
          <li>{t("flywheelRepeatWeekly")}</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("flywheelSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("flywheelSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("flywheelFooterNote")}</p>
      </section>
    </div>
  );
}
