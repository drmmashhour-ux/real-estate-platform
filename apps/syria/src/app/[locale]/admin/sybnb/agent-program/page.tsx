import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin");
  return {
    title: t("agentPerfPageTitle"),
    description: t("agentPerfSubtitle"),
  };
}

export default async function AdminSybnbAgentPerformancePlaybookPage() {
  const t = await getTranslations("Admin");

  const weeklyItems = [t("agentPerfWeekly1"), t("agentPerfWeekly2")];
  const trackingItems = [t("agentPerfTracking1"), t("agentPerfTracking2"), t("agentPerfTracking3")];
  const leaderboardItems = [t("agentPerfLeaderboard1"), t("agentPerfLeaderboard2")];
  const feedbackItems = [t("agentPerfFeedback1"), t("agentPerfFeedback2")];

  return (
    <div className="space-y-10 [dir=rtl]:text-right">
      <header className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/90">{t("agentPerfKicker")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("agentPerfTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{t("agentPerfSubtitle")}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-violet-950">{t("agentPerfWeeklySectionTitle")}</h2>
        <p className="text-sm font-medium text-violet-950/90">{t("agentPerfWeeklyLead")}</p>
        <ul className="space-y-3 text-sm leading-relaxed text-violet-950/95">
          {weeklyItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-violet-600" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">{t("agentPerfTrackingSectionTitle")}</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-emerald-950/95">
          {trackingItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-sky-950">{t("agentPerfLeaderboardSectionTitle")}</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-sky-950/95">
          {leaderboardItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-sky-600" aria-hidden>
                ★
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">{t("agentPerfFeedbackSectionTitle")}</h2>
        <p className="text-sm font-medium text-stone-800">{t("agentPerfFeedbackLead")}</p>
        <ul className="space-y-3 text-sm leading-relaxed text-stone-700">
          {feedbackItems.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="text-stone-400" aria-hidden>
                →
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/90 to-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-950">{t("agentPerfRemovalSectionTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-rose-950/95">{t("agentPerfRemovalBody")}</p>
      </section>

      <section className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">{t("agentPerfSuccessTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-950/90">{t("agentPerfSuccessBody")}</p>
        <p className="mt-4 text-xs text-stone-600">{t("agentPerfFooterNote")}</p>
      </section>

      <p className="text-center text-sm">
        <Link href="/admin/sybnb/agents" className="font-medium text-violet-800 underline decoration-violet-300 hover:text-violet-950">
          {t("agentPerfAgentsDashboardCta")}
        </Link>
      </p>
    </div>
  );
}
