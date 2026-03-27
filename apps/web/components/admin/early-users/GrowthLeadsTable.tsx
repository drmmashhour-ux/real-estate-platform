"use client";

import { useCallback, useEffect, useState } from "react";

type LeadRow = {
  id: string;
  email: string;
  phone: string | null;
  intent: "HOST" | "GUEST";
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
};

export function GrowthLeadsTable() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/growth-leads", { credentials: "same-origin" });
      if (!res.ok) throw new Error(await res.text());
      setRows((await res.json()) as LeadRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Landing leads (/early-access)</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          Refresh
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full min-w-[720px] text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Intent</th>
              <th className="px-3 py-2">Source / UTM</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  No landing captures yet. Share <code className="text-slate-400">/early-access</code>.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.email}</td>
                  <td className="px-3 py-2 text-xs">{r.phone ?? "—"}</td>
                  <td className="px-3 py-2">{r.intent}</td>
                  <td className="max-w-[240px] px-3 py-2 text-xs text-slate-400">
                    {r.source ?? "—"}
                    {r.utmSource ? ` · utm: ${r.utmSource}` : ""}
                    {r.utmCampaign ? ` / ${r.utmCampaign}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
