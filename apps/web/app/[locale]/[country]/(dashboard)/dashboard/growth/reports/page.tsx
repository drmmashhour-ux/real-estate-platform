import Link from "next/link";
import { engineFlags, reputationEngineFlags, softLaunchFlags } from "@/config/feature-flags";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { GrowthReportsClient } from "@/components/growth/GrowthReportsClient";

export const dynamic = "force-dynamic";

export default async function GrowthReportsPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  await requireAuthenticatedUser();
  const { locale, country } = await params;
  const base = `/${locale}/${country}/dashboard`;

  if (!engineFlags.marketingIntelligenceV1) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-white">
        <h1 className="text-2xl font-bold">Growth reports</h1>
        <p className="text-sm text-zinc-400">
          Enable <code className="rounded bg-zinc-800 px-1">FEATURE_MARKETING_INTELLIGENCE_V1=true</code> for ROI and
          performance summaries.
        </p>
        <Link href={base} className="text-sm text-emerald-400 hover:underline">
          ← Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-white">
      <div>
        <h1 className="text-2xl font-bold">Growth & ROI</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Aggregates <strong className="text-zinc-400">reported</strong> spend/revenue from marketing performance events
          (last 90 days). No synthetic booking or payment data.
        </p>
      </div>
      <GrowthReportsClient
        showRankingInsights={engineFlags.marketingIntelligenceV1 && reputationEngineFlags.rankingEngineV1}
        showSoftLaunch={engineFlags.marketingIntelligenceV1 && softLaunchFlags.softLaunchV1}
      />
      <p className="text-xs text-zinc-600">
        Record events via <code className="text-zinc-500">POST /api/marketing-system/v2/events</code> (performance /
        funnel) from your campaigns when ready.
      </p>
    </div>
  );
}
