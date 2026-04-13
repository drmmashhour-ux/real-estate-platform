"use client";

import { useState } from "react";

type Snapshot = {
  since: string;
  bookingsCreated: number;
  paymentsCompleted: number;
  paymentsFailed: number;
  paymentFailureRate: number;
  disputesCreated: number;
  fraudSignalsCreated: number;
};
type Alert = { id: string; alertType: string; severity: string; message: string; currentValue?: number | null; threshold?: number | null; createdAt: string | Date };
type Incident = { id: string; title: string; severity: string; status: string; startedAt: string | Date };

export function HealthDashboardClient({
  snapshot,
  alerts,
  incidents,
}: {
  snapshot: Snapshot;
  alerts: Alert[];
  incidents: Incident[];
}) {
  const [resolving, setResolving] = useState<string | null>(null);

  async function resolveAlert(id: string) {
    setResolving(id);
    try {
      await fetch(`/api/admin/health/alerts/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      window.location.reload();
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Health snapshot (last 24h)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Bookings created</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{snapshot.bookingsCreated}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Payments completed</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">{snapshot.paymentsCompleted}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Payment failure rate</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{(snapshot.paymentFailureRate * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Disputes / Fraud signals</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{snapshot.disputesCreated} / {snapshot.fraudSignalsCreated}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Active alerts</h2>
        {alerts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No active alerts.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/60 px-3 py-2">
                <div>
                  <span className={`text-xs font-medium ${a.severity === "CRITICAL" ? "text-red-400" : a.severity === "WARNING" ? "text-amber-400" : "text-slate-400"}`}>
                    {a.alertType}
                  </span>
                  <p className="text-sm text-slate-300">{a.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => resolveAlert(a.id)}
                  disabled={resolving === a.id}
                  className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                >
                  Resolve
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Open incidents</h2>
        {incidents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No open incidents.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {incidents.map((i) => (
              <li key={i.id} className="rounded-lg border border-slate-700/60 px-3 py-2">
                <span className="font-medium text-slate-200">{i.title}</span>
                <span className="ml-2 text-xs text-slate-500">{i.severity} · {new Date(i.startedAt as string).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
