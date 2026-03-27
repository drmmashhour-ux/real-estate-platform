"use client";

import { useState } from "react";

type Alert = {
  id: string;
  signalIds: string[];
  riskScore: number;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string | Date;
};

export function FraudAlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/bnhub/fraud/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setAlerts((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setUpdating(null);
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
        No new fraud alerts.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {alerts.map((a) => (
        <li key={a.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-medium text-slate-100">Risk score: {(a.riskScore * 100).toFixed(0)}%</p>
              <p className="text-sm text-slate-400">Signals: {a.signalIds.length} · {new Date(a.createdAt as string).toLocaleString()}</p>
              {a.notes && <p className="mt-1 text-sm text-slate-500">{a.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateStatus(a.id, "REVIEWING")}
                disabled={updating === a.id}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Reviewing
              </button>
              <button
                type="button"
                onClick={() => updateStatus(a.id, "RESOLVED")}
                disabled={updating === a.id}
                className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                Resolve
              </button>
              <button
                type="button"
                onClick={() => updateStatus(a.id, "DISMISSED")}
                disabled={updating === a.id}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
