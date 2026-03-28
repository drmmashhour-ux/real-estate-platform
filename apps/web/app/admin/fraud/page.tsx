import Link from "next/link";
import { getFraudAlertsQueue } from "@/lib/bnhub/fraud";
import {
  getHighRiskListings,
  getDuplicateCadastreAlerts,
  getSuspiciousBrokers,
  getUnderInvestigationListings,
} from "@/lib/anti-fraud/admin-dashboard";
import { FraudAlertsClient } from "./fraud-alerts-client";
import { AntiFraudDashboardClient } from "./anti-fraud-dashboard-client";
import { FraudDashboardClient } from "@/components/admin/FraudDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const [alerts, highRiskListings, duplicateCadastreAlerts, suspiciousBrokers, underInvestigation] =
    await Promise.all([
      getFraudAlertsQueue({ status: "NEW", limit: 50 }),
      getHighRiskListings(50),
      getDuplicateCadastreAlerts(50),
      getSuspiciousBrokers(30),
      getUnderInvestigationListings(50),
    ]);
  const normalizedAlerts = (alerts as any[]).map((a) => ({
    ...a,
    signalIds: Array.isArray(a.signalIds) ? a.signalIds.filter((s: unknown): s is string => typeof s === "string") : [],
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-2xl font-semibold">Property Anti-Fraud</h1>
        <p className="mt-1 text-slate-400">
          High-risk listings, duplicate cadastre, suspicious brokers, and listing actions (freeze, approve, reject, request documents).
        </p>

        <AntiFraudDashboardClient
          highRiskListings={highRiskListings}
          duplicateCadastreAlerts={duplicateCadastreAlerts}
          suspiciousBrokers={suspiciousBrokers}
          underInvestigationListings={underInvestigation}
        />

        <FraudDashboardClient />

        <h2 className="mt-10 text-lg font-semibold">Legacy fraud alerts</h2>
        <p className="mt-1 text-sm text-slate-500">Aggregated fraud signals (booking/payment/review).</p>
        <FraudAlertsClient initialAlerts={normalizedAlerts} />
      </div>
    </main>
  );
}
