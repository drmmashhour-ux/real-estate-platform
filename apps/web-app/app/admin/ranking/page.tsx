import Link from "next/link";
import { getRankingWeights } from "@/lib/bnhub/search-ranking";
import { RankingConfigClient } from "./ranking-config-client";

export const dynamic = "force-dynamic";

export default async function AdminRankingPage() {
  const weights = await getRankingWeights();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Search ranking weights</h1>
        <p className="mt-1 text-slate-400">Configure how listing quality, verification, and host score affect search order.</p>
        <RankingConfigClient initialWeights={weights} />
      </div>
    </main>
  );
}
