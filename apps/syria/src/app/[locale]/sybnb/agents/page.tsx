import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSybnbAgentListingUsdBand } from "@/lib/sybnb/sybnb-agent-incentives";
import { getSybnbAgentLeaderboard } from "@/lib/sybnb/sybnb-agent-leaderboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sybnb.agents");
  return {
    title: t("pageTitle"),
    description: t("subtitle"),
  };
}

export default async function SybnbAgentsPage() {
  const t = await getTranslations("Sybnb.agents");
  const locale = await getLocale();
  const usd = getSybnbAgentListingUsdBand();
  const leaderboard = await getSybnbAgentLeaderboard({ windowDays: 7, limit: 10 });
  const waAgentsUrl = process.env.NEXT_PUBLIC_SYBNB_AGENTS_WHATSAPP_GROUP_URL?.trim() ?? "";
  const waCoreUrl = process.env.NEXT_PUBLIC_SYBNB_CORE_WHATSAPP_GROUP_URL?.trim() ?? "";

  const profileLines = [t("hiringProfile1"), t("hiringProfile2"), t("hiringProfile3")];
  const agentTasks = [t("agentTask1"), t("agentTask2"), t("agentTask3"), t("agentTask4")];
  const rules = [t("agentsRule1"), t("agentsRule2"), t("agentsRule3")];

  const hasAnyWa = waAgentsUrl.startsWith("http") || waCoreUrl.startsWith("http");

  const fmtInt = (n: number) =>
    n.toLocaleString(locale.toLowerCase().startsWith("ar") ? "ar-SY" : "en-US");

  return (
    <div className="space-y-12 pb-8 [dir=rtl]:text-right">
      <header className="space-y-3 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("kicker")}</p>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{t("title")}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-700">{t("subtitle")}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">{t("hiringTargetTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">{t("hiringTargetBody")}</p>
        </article>
        <article className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-950">{t("hiringProfileTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-amber-950/95">
            {profileLines.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("hireRecruitmentTitle")}</h2>
        <figure className="mt-4 overflow-hidden rounded-xl border border-emerald-200/80 bg-white shadow-inner">
          <pre className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-emerald-950 [dir=rtl]:text-right">{t("hireRecruitmentAr")}</pre>
        </figure>
        <p className="mt-3 text-sm leading-relaxed text-emerald-950/90 [dir=ltr]:text-left">{t("hireRecruitmentEn")}</p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">{t("agentTasksTitle")}</h2>
        <ol className="mt-4 grid gap-3">
          {agentTasks.map((line, i) => (
            <li
              key={line.slice(0, 48)}
              className="flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-800"
            >
              <span className="font-bold text-amber-800">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">{t("roleTitle")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">{t("roleBody")}</p>
        </article>
        <article className="rounded-2xl border border-stone-300 bg-stone-900 p-6 text-stone-50 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-200">{t("agentsRulesTitle")}</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed">
            {rules.map((line) => (
              <li key={line.slice(0, 48)} className="border-l-2 border-amber-400/70 ps-3">
                {line}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">{t("recruitTitle")}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[t("recruitStudents"), t("recruitFb"), t("recruitFriends")].map((line) => (
            <li
              key={line.slice(0, 24)}
              className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm font-medium text-amber-950"
            >
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-stone-50 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-900/90">{t("incentivesKicker")}</p>
          <h2 className="mt-2 text-lg font-semibold text-neutral-900">{t("incentivesRewardTitle")}</h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-neutral-800">
            <li>{t("incentivesListingBand", { min: String(usd.min), max: String(usd.max) })}</li>
            <li>{t("incentivesBookingPct")}</li>
            <li>{t("incentivesManual")}</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">{t("leaderboardTitle")}</h2>
          <p className="mt-2 text-sm text-neutral-600">{t("leaderboardSubtitle")}</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[420px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pe-3">{t("leaderboardColRank")}</th>
                  <th className="py-2 pe-3">{t("leaderboardColName")}</th>
                  <th className="py-2 pe-3 tabular-nums">{t("leaderboardColListings")}</th>
                  <th className="py-2 tabular-nums">{t("leaderboardColBookings")}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-neutral-500">
                      {t("leaderboardEmpty")}
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((row, i) => (
                    <tr key={row.agentUserId} className="border-b border-neutral-100">
                      <td className="py-2.5 pe-3 font-semibold text-neutral-900">{i + 1}</td>
                      <td className="py-2.5 pe-3 font-medium text-neutral-900">{row.displayName}</td>
                      <td className="py-2.5 pe-3 tabular-nums text-neutral-800">{fmtInt(row.listingsWindow)}</td>
                      <td className="py-2.5 tabular-nums text-neutral-800">{fmtInt(row.bookingsWindow)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{t("toolsTitle")}</h2>
          <p className="mt-2 text-sm text-neutral-600">{t("toolsIntro")}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-inner">
            <figcaption className="border-b border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("dmTitle")}
            </figcaption>
            <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap p-4 text-sm leading-relaxed text-neutral-800 [dir=ltr]:text-left">
              {t("dmBody")}
            </pre>
          </figure>
          <figure className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-inner">
            <figcaption className="border-b border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("dmTitleAr")}
            </figcaption>
            <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap p-4 text-sm leading-relaxed text-neutral-800 [dir=rtl]:text-right">
              {t("dmBodyAr")}
            </pre>
          </figure>
        </div>
        <figure className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <figcaption className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900">
            {t("templateTitle")}
          </figcaption>
          <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap p-4 text-sm leading-relaxed text-neutral-800 [dir=ltr]:text-left">
            {t("templateBody")}
          </pre>
        </figure>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900">{t("workflowTitle")}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-neutral-900">{t("workflowOptionATitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{t("workflowABody")}</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-neutral-900">{t("workflowOptionBTitle")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{t("workflowBBody")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/quick-post"
                className="inline-flex min-h-10 items-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
              >
                {t("linkQuickPost")}
              </Link>
              <Link
                href="/sybnb/host"
                className="inline-flex min-h-10 items-center rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                {t("linkHostDash")}
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("whatsappTitle")}</h2>
        <p className="mt-2 text-sm text-emerald-950/90">{t("whatsappGroupsIntro")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80">{t("whatsappCoreLead")}</p>
            <p className="mt-1 font-bold text-emerald-950">{t("whatsappCoreName")}</p>
            {waCoreUrl.startsWith("http") ? (
              <a
                href={waCoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                {t("whatsappCoreCta")}
              </a>
            ) : (
              <p className="mt-3 text-xs text-emerald-900/60">—</p>
            )}
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80">{t("whatsappAgentsLead")}</p>
            <p className="mt-1 font-bold text-emerald-950">{t("whatsappAgentsName")}</p>
            {waAgentsUrl.startsWith("http") ? (
              <a
                href={waAgentsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {t("whatsappAgentsCta")}
              </a>
            ) : (
              <p className="mt-3 text-xs text-emerald-900/60">—</p>
            )}
          </div>
        </div>
        {!hasAnyWa ? <p className="mt-4 text-sm text-emerald-950/85">{t("whatsappFallback")}</p> : null}
      </section>
    </div>
  );
}
