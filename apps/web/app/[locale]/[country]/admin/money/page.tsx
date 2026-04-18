import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { MoneyOperatingSystemDashboard } from "@/components/admin/MoneyOperatingSystemDashboard";

export const dynamic = "force-dynamic";

export default async function AdminMoneyOperatingSystemPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdminSurface(uid))) redirect("/admin");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Money OS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Daily money command center</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Targets, leaks, and executable actions from live <code className="text-slate-500">revenue_events</code>,
          funnel signals, and subscription MRR — deterministic rules only.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
          <Link href="/admin/revenue" className="text-slate-400 hover:text-slate-200">
            Revenue intelligence
          </Link>
          <Link href="/admin/global-money" className="text-violet-400 hover:text-violet-300">
            Global MOS
          </Link>
          <Link href="/admin/growth-dashboard" className="text-slate-400 hover:text-slate-200">
            Growth dashboard
          </Link>
        </div>

        <div className="mt-10">
          <MoneyOperatingSystemDashboard />
        </div>
      </div>
    </main>
  );
}
