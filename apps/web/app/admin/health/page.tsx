import Link from "next/link";
import {
  getPlatformHealthSnapshot,
  getActiveAlerts,
  getOperationalIncidents,
} from "@/lib/observability";
import { HealthDashboardClient } from "./health-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const [snapshot, alerts, incidents] = await Promise.all([
    getPlatformHealthSnapshot(),
    getActiveAlerts(20),
    getOperationalIncidents({ status: "OPEN", limit: 10 }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Platform health & observability</h1>
        <p className="mt-1 text-slate-400">
          Service health, booking funnel, payments, fraud/dispute volume, alerts, incidents.
        </p>
        <HealthDashboardClient
          snapshot={snapshot}
          alerts={alerts}
          incidents={incidents}
        />
      </div>
    </main>
  );
}
