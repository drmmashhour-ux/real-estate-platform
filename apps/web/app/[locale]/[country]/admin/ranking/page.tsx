import Link from "next/link";
import { getRankingWeights } from "@/lib/bnhub/search-ranking";
import { RankingDashboardClient } from "@/components/admin/RankingDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminRankingPage() {
  const legacyWeights = await getRankingWeights();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Listing ranking</h1>
        <p className="mt-1 text-slate-400">
          LECIPM + BNHUB explainable ranking, configs, persisted scores, and legacy search weights.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Enable with <code className="rounded bg-slate-800 px-1">FEATURE_RANKING_V1=1</code> or legacy{" "}
          <code className="rounded bg-slate-800 px-1">AI_RANKING_ENGINE_ENABLED=1</code> — optional{" "}
          <code className="rounded bg-slate-800 px-1">AI_RANKING_EXPLANATIONS_ENABLED=1</code>
        </p>
        <div className="mt-8">
          <RankingDashboardClient initialLegacyWeights={legacyWeights} />
        </div>
      </div>
    </main>
  );
}
