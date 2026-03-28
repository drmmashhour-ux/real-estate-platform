import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { EarlyUsersTable } from "@/components/admin/early-users/EarlyUsersTable";
import { GrowthLeadsTable } from "@/components/admin/early-users/GrowthLeadsTable";
import { GrowthCrmPanels } from "@/components/admin/growth-crm/GrowthCrmPanels";

export const dynamic = "force-dynamic";

export default async function AdminGrowthCrmPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Growth engine</p>
      <h1 className="mt-2 text-3xl font-semibold">Growth CRM — 100 → 1000 users</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Funnel view, lead scoring, semi-automated follow-ups, referrals. Playbook:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/first-1000-users.md</code>. Personalized
        copy: <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">GET /api/admin/growth/personalized-message</code>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/growth-dashboard" className="text-emerald-400 hover:text-emerald-300">
          Growth dashboard (10K metrics) →
        </Link>
        <Link href="/admin/early-users" className="text-slate-400 hover:text-slate-300">
          Legacy early-users CRM
        </Link>
        <Link href="/early-access" className="text-slate-400 hover:text-slate-300">
          Public lead page
        </Link>
      </div>

      <div className="mt-10 space-y-12">
        <GrowthCrmPanels />
        <GrowthLeadsTable />
        <EarlyUsersTable />
      </div>
    </main>
  );
}
