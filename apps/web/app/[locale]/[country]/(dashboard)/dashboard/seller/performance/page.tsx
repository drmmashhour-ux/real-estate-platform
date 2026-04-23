import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { RANKING_LISTING_TYPE_REAL_ESTATE } from "@/src/modules/ranking/dataMap";

export const dynamic = "force-dynamic";

export default async function SellerPerformancePage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/seller/performance");

  const listings = await prisma.fsboListing.findMany({
    where: { ownerId: userId },
    select: { id: true, title: true, city: true, status: true, rankingTotalScoreCache: true, rankingPerformanceBand: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const ids = listings.map((l) => l.id);
  if (ids.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-slate-100">
        <Link href="/dashboard/seller" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Seller hub
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Listing performance</h1>
        <p className="mt-2 text-sm text-slate-500">Create a listing to see views, leads, and ranking signals.</p>
      </main>
    );
  }

  const [viewGroups, leadGroups, rankRows] = await Promise.all([
    prisma.buyerListingView.groupBy({
      by: ["fsboListingId"],
      where: { fsboListingId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.fsboLead.groupBy({
      by: ["listingId"],
      where: { listingId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.listingRankingScore.findMany({
      where: { listingType: RANKING_LISTING_TYPE_REAL_ESTATE, listingId: { in: ids } },
      select: { listingId: true, totalScore: true, performanceBand: true },
    }),
  ]);

  const viewsMap = new Map(viewGroups.map((g) => [g.fsboListingId, g._count._all]));
  const leadsMap = new Map(leadGroups.map((g) => [g.listingId, g._count._all]));
  const rankMap = new Map(rankRows.map((r) => [r.listingId, r]));

  const totalViews = [...viewsMap.values()].reduce((a, b) => a + b, 0);
  const totalLeads = [...leadsMap.values()].reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 text-slate-100">
      <Link href="/dashboard/seller" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Seller hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Listing performance</h1>
      <p className="mt-2 text-sm text-slate-400">
        Internal discovery and engagement signals — not a guarantee of sale speed. Ranking bands update when batch jobs run.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Listings</p>
          <p className="text-2xl font-semibold">{listings.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Buyer views (total)</p>
          <p className="text-2xl font-semibold">{totalViews}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Inquiries</p>
          <p className="text-2xl font-semibold">{totalLeads}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Views</th>
              <th className="px-3 py-2">Leads</th>
              <th className="px-3 py-2">Rank (cache)</th>
              <th className="px-3 py-2">Band</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => {
              const r = rankMap.get(l.id);
              const band = r?.performanceBand ?? l.rankingPerformanceBand ?? "—";
              const score = r?.totalScore ?? l.rankingTotalScoreCache;
              return (
                <tr key={l.id} className="border-b border-slate-800/80">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/seller/listings/${l.id}`} className="font-medium text-emerald-300 hover:underline">
                      {l.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {l.city} · {l.status}
                    </p>
                  </td>
                  <td className="px-3 py-2">{viewsMap.get(l.id) ?? 0}</td>
                  <td className="px-3 py-2">{leadsMap.get(l.id) ?? 0}</td>
                  <td className="px-3 py-2">{Math.round(score)}</td>
                  <td className="px-3 py-2 capitalize">{band}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        {/* TODO v2: conversion funnel, saved count, and experiment-aware segments. */}
        For pricing and revenue heuristics, see{" "}
        <Link href="/dashboard/seller/revenue" className="text-emerald-400 hover:underline">
          Revenue insights
        </Link>
        .
      </p>
    </main>
  );
}
