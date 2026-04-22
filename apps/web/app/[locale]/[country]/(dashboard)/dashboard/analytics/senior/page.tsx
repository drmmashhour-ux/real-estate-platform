import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SeniorHubAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { locale, country } = await params;
  const dash = `/${locale}/${country}/dashboard`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== PlatformRole.ADMIN) {
    redirect(dash);
  }

  const [aiProfiles, matchRows, leadAiScores, areaRows, learnEvents, operatorPerf] = await Promise.all([
    prisma.seniorAiProfile.count(),
    prisma.seniorMatchingResult.count(),
    prisma.seniorLeadScore.count(),
    prisma.seniorAreaInsight.count(),
    prisma.seniorLearningEvent.count(),
    prisma.seniorOperatorPerformance.count(),
  ]);

  return (
    <div className="space-y-8 p-4 text-sm text-slate-100">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">Analytics</p>
        <h1 className="mt-1 text-2xl font-bold">Senior Living — AI layer</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          High-level counts for the maximum-AI vertical. Use product analytics and funnels for conversion and CTR; this
          view helps confirm the AI subsystem is storing signals.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Senior AI profiles</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{aiProfiles}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Stored match rows</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{matchRows}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">AI lead scores recorded</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{leadAiScores}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Area insights rows</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{areaRows}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Learning events</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{learnEvents}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500">Operator perf snapshots</p>
          <p className="mt-1 text-2xl font-semibold text-teal-300">{operatorPerf}</p>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Track completion rate, lead rate, visit conversion, and experiment arms (voice-first vs tap-first,
        sl_n=3|5… ) via your analytics pipeline tagging these routes:{" "}
        <code className="text-teal-300">/senior-living/results</code>,{" "}
        <code className="text-teal-300">/api/senior/ai/match</code>.
      </p>

      <Link href={`/${locale}/${country}/dashboard/senior`} className="inline-block font-semibold text-teal-400 underline">
        ← Operator leads dashboard
      </Link>
    </div>
  );
}
