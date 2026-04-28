import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("workflowPageTitle"),
    description: t("workflowSubtitle"),
  };
}

export default async function AdminSybnbWorkflowPage() {
  const t = await getTranslations("Admin");

  const processSteps = [
    { title: t("workflowStep1Title"), body: t("workflowStep1Body") },
    { title: t("workflowStep2Title"), body: t("workflowStep2Body") },
    { title: t("workflowStep3Title"), body: t("workflowStep3Body") },
  ];

  const templates = [
    { title: t("workflowIntroTitle"), body: t("workflowIntroBody") },
    { title: t("workflowFollowUpTitle"), body: t("workflowFollowUpBody") },
    { title: t("workflowClosingTitle"), body: t("workflowClosingBody") },
  ];

  const frictionItems = [t("workflowFriction1"), t("workflowFriction2")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("workflowKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("workflowTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("workflowSubtitle")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">{t("workflowProcessSectionTitle")}</h2>
        <ol className="grid gap-4">
          {processSteps.map((item, i) => (
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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{t("workflowTemplatesSectionTitle")}</h2>
          <p className="mt-2 text-sm text-stone-600">{t("workflowTemplatesLead")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          {templates.map((tpl) => (
            <div
              key={tpl.title}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-stone-900">{tpl.title}</h3>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-sans text-sm leading-relaxed text-stone-800">
                {tpl.body}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">{t("workflowRolesSectionTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-sky-950">{t("workflowRoleOpsTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-sky-950/95">{t("workflowRoleOpsBody")}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-emerald-950">{t("workflowRoleAgentsTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-emerald-950/95">{t("workflowRoleAgentsBody")}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("workflowFrictionSectionTitle")}</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-emerald-950/95">
          {frictionItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("workflowSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("workflowSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("workflowFooterNote")}</p>
      </section>
    </div>
  );
}
