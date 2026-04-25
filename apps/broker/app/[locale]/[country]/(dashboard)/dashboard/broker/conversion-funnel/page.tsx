"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FunnelPayload = {
  days: number;
  since: string;
  activityByEvent: Record<string, number>;
  leads: { total: number; hotApprox: number; immoAiChat: number };
  hints: Record<string, string | null>;
  note?: string;
};

export default function ConversionFunnelPage() {
  const [data, setData] = useState<FunnelPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/broker/conversion-funnel?days=14", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setError(j.error ?? "Unable to load");
          return;
        }
        setData(j);
      })
      .catch(() => setError("Network error"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Broker hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Conversion funnel</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Aggregated activity from signed-in users (last 14 days by default). Use with CRM leads to spot drop-offs:
        search → listing view → contact → chat → capture → hot handoff.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}

      {data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-emerald-400">Leads (CRM)</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>All new leads: {data.leads.total}</li>
              <li>Hot (tier / score heuristic): {data.leads.hotApprox}</li>
              <li>Immo AI chat source: {data.leads.immoAiChat}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-sm font-semibold text-emerald-400">Directional rates</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {Object.entries(data.hints).map(([k, v]) => (
                <li key={k}>
                  <span className="text-slate-500">{k}:</span> {v ?? "—"}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-emerald-400">Event counts</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.activityByEvent)
                .filter(([, n]) => n > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => (
                  <div key={k} className="flex justify-between rounded-lg bg-slate-950/80 px-3 py-2 text-sm">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-mono text-slate-200">{n}</span>
                  </div>
                ))}
            </div>
            {data.note && <p className="mt-4 text-xs text-slate-500">{data.note}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
