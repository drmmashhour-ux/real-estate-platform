import Link from "next/link";
import { getSupplyGrowthMetrics } from "@/lib/bnhub/supply-growth";
import { SupplyGrowthClient } from "./supply-growth-client";

export const dynamic = "force-dynamic";

export default async function AdminSupplyGrowthPage() {
  const metrics = await getSupplyGrowthMetrics({ days: 30 });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Supply growth & acquisition</h1>
        <p className="mt-1 text-slate-400">Track new listings, hosts, and referral signups.</p>
        <SupplyGrowthClient initialMetrics={metrics} />
      </div>
    </main>
  );
}
