import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("dailyExecPageTitle"),
    description: t("dailyExecSubtitle"),
  };
}

export default async function AdminSybnbDailyExecutionPage() {
  const t = await getTranslations("Admin");

  const dailyItems = [
    { title: t("dailyExec1Title"), body: t("dailyExec1Body") },
    { title: t("dailyExec2Title"), body: t("dailyExec2Body") },
    { title: t("dailyExec3Title"), body: t("dailyExec3Body") },
    { title: t("dailyExec4Title"), body: t("dailyExec4Body") },
    { title: t("dailyExec5Title"), body: t("dailyExec5Body") },
  ];

  const weeklyItems = [t("dailyExecWeekly1"), t("dailyExecWeekly2"), t("dailyExecWeekly3")];
  const rules = [t("dailyExecRules1"), t("dailyExecRules2"), t("dailyExecRules3")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("dailyExecKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("dailyExecTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("dailyExecSubtitle")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">{t("dailyExecDailySectionTitle")}</h2>
        <ol className="grid gap-4">
          {dailyItems.map((item, i) => (
            <li
              key={item.title}
              className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-950"
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("dailyExecWeeklySectionTitle")}</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-emerald-950/95">
          {weeklyItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-300 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("dailyExecRulesSectionTitle")}</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-stone-100">
          {rules.map((line) => (
            <li key={line.slice(0, 48)} className="border-l-2 border-amber-400/80 ps-3">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("dailyExecSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("dailyExecSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("dailyExecFooterNote")}</p>
      </section>
    </div>
  );
}
