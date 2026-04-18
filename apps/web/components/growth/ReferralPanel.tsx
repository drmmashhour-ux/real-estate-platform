"use client";

import { useState } from "react";

type Aggregates = {
  totalAllTime: number;
  total90d: number;
  statusBreakdown: Record<string, number>;
};

export function ReferralPanel({
  aggregates,
  recent,
}: {
  aggregates: Aggregates | null;
  recent: { id: string; code: string; status: string; inviteKind: string | null; createdAt: string }[];
}) {
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function createCode() {
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch("/api/growth/referrals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMsg(`Created code ${data.referral?.code ?? "—"} (admin test)`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">Referrals</h3>
      <p className="mb-4 text-xs text-slate-500">Platform referral rows — fraud review uses separate tooling.</p>

      {aggregates ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-500">All time</p>
            <p className="text-lg font-semibold tabular-nums text-slate-100">{aggregates.totalAllTime}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-500">Last 90d</p>
            <p className="text-lg font-semibold tabular-nums text-slate-100">{aggregates.total90d}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <p className="text-xs text-slate-500">Statuses</p>
            <p className="text-xs text-slate-400">
              {Object.entries(aggregates.statusBreakdown)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || "—"}
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={creating}
        onClick={createCode}
        className="mb-4 rounded-lg border border-violet-600/60 bg-violet-950/40 px-3 py-2 text-sm text-violet-100 hover:bg-violet-900/50 disabled:opacity-50"
      >
        {creating ? "Creating…" : "Create test referral code (admin)"}
      </button>
      {msg ? <p className="mb-3 text-sm text-emerald-400">{msg}</p> : null}

      <div className="max-h-48 overflow-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500">
              <th className="px-2 py-2">Code</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-b border-slate-800/80 text-slate-300">
                <td className="px-2 py-1.5 font-mono">{r.code}</td>
                <td className="px-2 py-1.5">{r.status}</td>
                <td className="px-2 py-1.5 text-slate-500">{new Date(r.createdAt).toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
