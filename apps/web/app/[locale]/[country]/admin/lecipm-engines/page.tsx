import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export default async function LecipmEnginesAdminPage() {
  const auth = await requireAdminSession();
  if (!auth.ok) redirect("/auth/login?returnUrl=/admin/lecipm-engines");

  const [
    rankingRows,
    pendingAutopilot,
    growthCandidates,
    seoCandidates,
    weakListings,
    topRanked,
  ] = await Promise.all([
    prisma.listingRankingScore.count(),
    prisma.lecipmCoreAutopilotAction.count({ where: { status: "pending" } }),
    prisma.growthOpportunityCandidate.count({ where: { status: "pending" } }),
    prisma.seoPageOpportunity.count({ where: { status: "candidate" } }),
    prisma.fsboListing.count({
      where: {
        status: "ACTIVE",
        moderationStatus: "APPROVED",
        images: { isEmpty: true },
      },
    }),
    prisma.listingRankingScore.findMany({
      orderBy: { totalScore: "desc" },
      take: 8,
      select: { listingId: true, listingType: true, totalScore: true, performanceBand: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">LECIPM engines (v1)</h1>
        <p className="mt-2 text-sm text-slate-400">
          Internal visibility for ranking, core autopilot, and growth candidates. Scoring runs server-side; nothing here
          exposes raw factor weights publicly.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-medium text-slate-200">Feature flags</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-slate-400">
              <li>ranking_v1: {String(engineFlags.rankingV1)}</li>
              <li>listing_quality_v1: {String(engineFlags.listingQualityV1)}</li>
              <li>listing_autopilot_v1: {String(engineFlags.listingAutopilotV1)}</li>
              <li>growth_autopilot_v1: {String(engineFlags.growthAutopilotV1)}</li>
              <li>seo_candidate_generation_v1: {String(engineFlags.seoCandidateGenerationV1)}</li>
              <li>reengagement_candidates_v1: {String(engineFlags.reengagementCandidatesV1)}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-medium text-slate-200">Queues & snapshots</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>Persisted ranking rows: {rankingRows}</li>
              <li>Pending autopilot actions: {pendingAutopilot}</li>
              <li>Growth opportunity candidates: {growthCandidates}</li>
              <li>SEO page opportunities: {seoCandidates}</li>
              <li>FSBO weak/empty media (heuristic): {weakListings}</li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-medium text-slate-200">Top ranked listings (sample)</h2>
          <ul className="mt-3 divide-y divide-slate-800 text-sm text-slate-300">
            {topRanked.map((r) => (
              <li key={`${r.listingType}-${r.listingId}`} className="flex justify-between py-2">
                <span className="font-mono text-xs text-slate-400">
                  {r.listingType} · {r.listingId.slice(0, 8)}…
                </span>
                <span>
                  {r.totalScore.toFixed(1)} · {r.performanceBand ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
          <p>
            Cron hooks (Bearer <code className="text-slate-400">CRON_SECRET</code>):{" "}
            <code className="text-slate-400">POST /api/internal/ranking/recalculate</code>,{" "}
            <code className="text-slate-400">POST /api/internal/autopilot/run</code>,{" "}
            <code className="text-slate-400">POST /api/internal/growth/scan</code>.
          </p>
          <p className="mt-2">
            Config weights UI: <Link className="text-amber-400 hover:text-amber-300" href="/admin/ranking">/admin/ranking</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
