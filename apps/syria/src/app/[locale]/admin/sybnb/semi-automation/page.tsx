import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SybnbFollowUpCopyButton } from "@/components/admin/SybnbFollowUpCopyButton";
import {
  SYBNB72_MIN_REPEAT_BEFORE_AUTOMATE,
  SYBNB72_DM_OUTREACH_SCRIPT_AR,
  SYBNB72_PARTNER_FOLLOW_UP_SCRIPT_AR,
  SYBNB72_CLOSING_SCRIPT_AR,
} from "@/lib/sybnb/sybnb-semi-automation-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("semiAutomationPageTitle"),
    description: t("semiAutomationSubtitle"),
  };
}

export default async function AdminSybnbSemiAutomationPage() {
  const t = await getTranslations("Admin");

  const scriptBlocks = [
    {
      key: "dm",
      title: t("semiAutomationTemplatesDmTitle"),
      lead: t("semiAutomationTemplatesDmLead"),
      body: SYBNB72_DM_OUTREACH_SCRIPT_AR,
    },
    {
      key: "follow",
      title: t("semiAutomationTemplatesFollowTitle"),
      lead: t("semiAutomationTemplatesFollowLead"),
      body: SYBNB72_PARTNER_FOLLOW_UP_SCRIPT_AR,
    },
    {
      key: "close",
      title: t("semiAutomationTemplatesCloseTitle"),
      lead: t("semiAutomationTemplatesCloseLead"),
      body: SYBNB72_CLOSING_SCRIPT_AR,
    },
  ];

  return (
    <div className="space-y-8 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("semiAutomationKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("semiAutomationTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("semiAutomationSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("semiAutomationTemplatesSectionTitle")}</h2>
        <p className="mt-2 text-sm text-stone-700">{t("semiAutomationTemplatesSectionLead")}</p>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/admin/sybnb/follow-ups" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
              {t("semiAutomationLinkFollowUps")}
            </Link>
          </li>
          <li>
            <Link href="/admin/sybnb/hotel-retention" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
              {t("semiAutomationLinkHotelRetention")}
            </Link>
          </li>
          <li>
            <Link href="/admin/sybnb/workflow" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
              {t("semiAutomationLinkWorkflow")}
            </Link>
          </li>
        </ul>

        <div className="mt-8 space-y-10">
          {scriptBlocks.map((block) => (
            <div key={block.key}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-stone-900">{block.title}</h3>
                  <p className="mt-1 text-xs text-stone-500">{block.lead}</p>
                </div>
                <SybnbFollowUpCopyButton text={block.body} idleLabel={t("semiAutomationCopyCta")} copiedLabel={t("semiAutomationCopyDone")} />
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 font-sans text-sm leading-relaxed text-stone-800">{block.body}</pre>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("semiAutomationDelegateTitle")}</h2>
        <p className="mt-2 text-sm text-stone-700">{t("semiAutomationDelegateLead")}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-emerald-50/60 p-4">
            <h3 className="text-sm font-semibold text-emerald-950">{t("semiAutomationAgentsHeading")}</h3>
            <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-emerald-950/90">
              <li>{t("semiAutomationAgentsOutreach")}</li>
              <li>{t("semiAutomationAgentsOnboarding")}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-stone-200 bg-indigo-50/60 p-4">
            <h3 className="text-sm font-semibold text-indigo-950">{t("semiAutomationYouHeading")}</h3>
            <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-indigo-950/90">
              <li>{t("semiAutomationYouClosing")}</li>
              <li>{t("semiAutomationYouDecisions")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("semiAutomationRepeatTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-stone-700">
          <li>{t("semiAutomationRepeatListingTemplates")}</li>
          <li>{t("semiAutomationRepeatResponses")}</li>
        </ul>
        <p className="mt-4 text-xs text-stone-500">{t("semiAutomationRepeatFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-rose-100 bg-rose-50/80 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-950">{t("semiAutomationRuleTitle")}</h2>
        <p className="mt-3 text-sm text-rose-950/90">
          {t("semiAutomationRuleBody", { n: SYBNB72_MIN_REPEAT_BEFORE_AUTOMATE })}
        </p>
      </section>

      <p className="text-xs text-stone-500">{t("semiAutomationSuccessNote")}</p>
    </div>
  );
}
