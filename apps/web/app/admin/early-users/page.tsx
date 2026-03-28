import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { EarlyUsersTable } from "@/components/admin/early-users/EarlyUsersTable";
import { GrowthLeadsTable } from "@/components/admin/early-users/GrowthLeadsTable";

export const dynamic = "force-dynamic";

export default async function AdminEarlyUsersPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">Acquisition</p>
      <h1 className="mt-2 text-3xl font-semibold">Early users — CRM</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Outreach + conversion tracking. Scale view (funnel, automation, leaderboard):{" "}
        <Link href="/admin/growth-crm" className="text-emerald-400 hover:text-emerald-300">
          /admin/growth-crm
        </Link>
        . Docs: <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/first-100-users.md</code>,{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/first-1000-users.md</code>. Public capture:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">/early-access</code>.
      </p>
      <Link href="/admin/launch" className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        ← Launch tracking
      </Link>

      <div className="mt-10 space-y-12">
        <GrowthLeadsTable />
        <EarlyUsersTable />
      </div>
    </main>
  );
}
