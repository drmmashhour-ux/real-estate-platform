import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("agentCommPageTitle"),
    description: t("agentCommSubtitle"),
  };
}

export default async function AdminSybnbAgentCommissionPage() {
  const t = await getTranslations("Admin");

  const dbItems = [t("agentCommDb1"), t("agentCommDb2")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("agentCommKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("agentCommTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("agentCommSubtitle")}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("agentCommFormulaSectionTitle")}</h2>
        <p className="text-sm font-medium text-violet-950/90">{t("agentCommFormulaLead")}</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-sm leading-relaxed text-violet-950 shadow-inner">
          {t("agentCommFormulaRule")}
        </pre>
        <p className="text-xs leading-relaxed text-violet-900/85">{t("agentCommFormulaNote")}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("agentCommExampleTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">{t("agentCommExampleBody")}</p>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("agentCommSourceSectionTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-950/95">{t("agentCommSourceBody")}</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-sky-950">{t("agentCommDbSectionTitle")}</h2>
        <p className="text-sm font-semibold text-sky-950">{t("agentCommDbLead")}</p>
        <ul className="space-y-3 text-sm leading-relaxed text-sky-950/95">
          {dbItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-sky-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("agentCommSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("agentCommSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("agentCommFooterNote")}</p>
      </section>
    </div>
  );
}
