import Link from "next/link";
import { getAllFeatureFlags, getActiveControls, getControlAuditLog } from "@/lib/operational-controls";
import { ControlsDashboardClient } from "./controls-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminControlsPage() {
  const [flags, controls, auditLog] = await Promise.all([
    getAllFeatureFlags(),
    getActiveControls(),
    getControlAuditLog(30),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Operational control layer</h1>
        <p className="mt-1 text-slate-400">
          Feature flags, kill switches, payout holds, listing freezes, booking restrictions. All actions are audited.
        </p>
        <ControlsDashboardClient
          initialFlags={flags}
          initialControls={controls}
          initialAuditLog={auditLog}
        />
      </div>
    </main>
  );
}
