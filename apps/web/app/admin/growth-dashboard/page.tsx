import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { GrowthDashboardClient } from "@/components/admin/growth-dashboard/GrowthDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminGrowthDashboardPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Scale — 10K</p>
      <h1 className="mt-2 text-3xl font-semibold">Growth dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        BNHub liquidity, LECIPM funnel, marketplace balance, and 100K domination cities. Playbooks:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/10k-scaling-system.md</code>,{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/100k-domination-system.md</code>.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/enterprise-dashboard" className="text-emerald-400 hover:text-emerald-300">
          Enterprise dashboard →
        </Link>
        <Link href="/admin/growth-crm" className="text-slate-400 hover:text-slate-300">
          Growth CRM
        </Link>
        <Link href="/api/analytics/growth-dashboard?days=30" className="text-slate-500 hover:text-slate-300">
          Raw JSON (legacy funnel)
        </Link>
      </div>
      <div className="mt-10">
        <GrowthDashboardClient />
      </div>
    </main>
  );
}
