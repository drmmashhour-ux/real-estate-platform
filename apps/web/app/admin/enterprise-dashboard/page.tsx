import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { EnterpriseDashboardClient } from "@/components/admin/enterprise-dashboard/EnterpriseDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminEnterpriseDashboardPage() {
  const uid = await getGuestId();
  const admin = await requireAdminUser(uid);
  if (!admin) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A646]">Enterprise</p>
      <h1 className="mt-2 text-3xl font-semibold">Enterprise dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Multi-region supply and demand, retention proxies, and acquisition funnel. This supports sustainable expansion
        — not a guarantee of market outcomes. Playbook:{" "}
        <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">docs/enterprise-scaling-system.md</code>.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/sales-dashboard" className="text-emerald-400 hover:text-emerald-300">
          Enterprise sales CRM →
        </Link>
        <Link href="/admin/growth-dashboard" className="text-slate-400 hover:text-slate-300">
          Growth dashboard
        </Link>
        <Link href="/admin/growth-crm" className="text-slate-400 hover:text-slate-300">
          Growth CRM
        </Link>
      </div>
      <div className="mt-10">
        <EnterpriseDashboardClient />
      </div>
    </main>
  );
}
