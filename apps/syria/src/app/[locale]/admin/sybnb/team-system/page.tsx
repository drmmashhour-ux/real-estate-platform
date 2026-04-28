import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  SYBNB74_AGENTS_COUNT_MIN,
  SYBNB74_AGENTS_COUNT_MAX,
  SYBNB74_CLOSERS_COUNT_MIN,
  SYBNB74_CLOSERS_COUNT_MAX,
  SYBNB74_AGENT_OUTBOUND_CONTACTS_PER_DAY,
} from "@/lib/sybnb/sybnb-team-system-playbook";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("teamSystemPageTitle"),
    description: t("teamSystemSubtitle"),
  };
}

export default async function AdminSybnbTeamSystemPage() {
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("teamSystemKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("teamSystemTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("teamSystemSubtitle")}</p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("teamSystemRolesTitle")}</h2>
        <p className="mt-2 text-sm text-stone-600">{t("teamSystemRolesLead")}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <h3 className="text-sm font-semibold text-emerald-950">{t("teamSystemRoleAgentsHeading")}</h3>
            <p className="mt-2 text-xs font-medium text-emerald-900/90">
              {t("teamSystemRoleAgentsRange", { min: SYBNB74_AGENTS_COUNT_MIN, max: SYBNB74_AGENTS_COUNT_MAX })}
            </p>
            <p className="mt-2 text-sm text-emerald-950/95">{t("teamSystemRoleAgentsBody")}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
            <h3 className="text-sm font-semibold text-sky-950">{t("teamSystemRoleClosersHeading")}</h3>
            <p className="mt-2 text-xs font-medium text-sky-900/90">
              {t("teamSystemRoleClosersRange", { min: SYBNB74_CLOSERS_COUNT_MIN, max: SYBNB74_CLOSERS_COUNT_MAX })}
            </p>
            <p className="mt-2 text-sm text-sky-950/95">{t("teamSystemRoleClosersBody")}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <h3 className="text-sm font-semibold text-indigo-950">{t("teamSystemRoleYouHeading")}</h3>
            <p className="mt-2 text-sm text-indigo-950/95">{t("teamSystemRoleYouBody")}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("teamSystemDailyTitle")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
            <h3 className="text-sm font-semibold text-stone-900">{t("teamSystemDailyAgentsHeading")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-800">
              {t("teamSystemDailyAgentsBody", { n: SYBNB74_AGENT_OUTBOUND_CONTACTS_PER_DAY })}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
            <h3 className="text-sm font-semibold text-stone-900">{t("teamSystemDailyClosersHeading")}</h3>
            <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-stone-800">
              <li>{t("teamSystemDailyClosersReply")}</li>
              <li>{t("teamSystemDailyClosersClose")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("teamSystemTrainingTitle")}</h2>
        <p className="mt-2 text-sm text-violet-950/90">{t("teamSystemTrainingLead")}</p>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-violet-950/95">
          <li>{t("teamSystemTrainingDm")}</li>
          <li>{t("teamSystemTrainingClose")}</li>
          <li>{t("teamSystemTrainingFollowUp")}</li>
        </ul>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <li>
            <Link href="/admin/sybnb/semi-automation" className="font-semibold text-violet-900 underline-offset-2 hover:underline">
              {t("teamSystemLinkSemiAutomation")}
            </Link>
          </li>
          <li>
            <Link href="/admin/sybnb/workflow" className="font-semibold text-violet-900 underline-offset-2 hover:underline">
              {t("teamSystemLinkWorkflow")}
            </Link>
          </li>
          <li>
            <Link href="/admin/sybnb/follow-ups" className="font-semibold text-violet-900 underline-offset-2 hover:underline">
              {t("teamSystemLinkFollowUps")}
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("teamSystemIncentivesTitle")}</h2>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-amber-950/95">
          <li>{t("teamSystemIncentiveDeal")}</li>
          <li>{t("teamSystemIncentiveHotel")}</li>
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/admin/sybnb/agent-commission" className="font-semibold text-amber-900 underline-offset-2 hover:underline">
            {t("teamSystemLinkCommission")}
          </Link>
        </p>
      </section>

      <section className="rounded-2xl border border-stone-300 bg-stone-900 p-6 text-stone-50 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-200">{t("teamSystemControlTitle")}</h2>
        <p className="mt-2 text-sm text-stone-200">{t("teamSystemControlLead")}</p>
        <ul className="mt-4 list-disc space-y-2 ps-5 text-sm text-stone-100">
          <li>{t("teamSystemControlTrack")}</li>
          <li>{t("teamSystemControlPrune")}</li>
        </ul>
        <p className="mt-4 text-xs text-stone-400">{t("teamSystemControlFootnote")}</p>
      </section>

      <section className="rounded-2xl border border-emerald-300/80 bg-emerald-50/70 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("teamSystemSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-950/95">{t("teamSystemSuccessBody")}</p>
      </section>
    </div>
  );
}
