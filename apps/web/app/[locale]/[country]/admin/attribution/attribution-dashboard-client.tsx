"use client";

import { useEffect, useState } from "react";

type Row = { source: string; leads: number; won: number; conversionRatePct: number };
type CampaignRow = { campaign: string; leads: number };

export function AttributionDashboardClient() {
  const [data, setData] = useState<{
    leadsBySource: Row[];
    topCampaigns: CampaignRow[];
    eventsByType: Record<string, number>;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/attribution-stats", { cache: "no-store" });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j.error ?? "Failed to load");
        }
        if (!cancelled) {
          setData({
            leadsBySource: j.leadsBySource ?? [],
            topCampaigns: j.topCampaigns ?? [],
            eventsByType: j.eventsByType ?? {},
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading attribution…</p>;
  }

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-slate-200">Leads by source</h2>
        <p className="mt-1 text-sm text-slate-500">
          First-touch from <code className="text-slate-400">?source=</code> / UTM (cookie). Conversion = pipeline
          status <span className="text-amber-400/90">won</span>.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Source</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Leads</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Won</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Conv. %</th>
              </tr>
            </thead>
            <tbody>
              {data.leadsBySource.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500">
                    No leads yet.
                  </td>
                </tr>
              ) : (
                data.leadsBySource.map((r) => (
                  <tr key={r.source} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 text-slate-200">{r.source}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{r.leads}</td>
                    <td className="px-4 py-3 text-right text-emerald-300/90">{r.won}</td>
                    <td className="px-4 py-3 text-right font-medium text-amber-300/90">
                      {r.conversionRatePct}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Top campaigns</h2>
        <p className="mt-1 text-sm text-slate-500">By lead volume (non-null campaign).</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Campaign</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Leads</th>
              </tr>
            </thead>
            <tbody>
              {data.topCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-slate-500">
                    No campaign-tagged leads yet. Use{" "}
                    <code className="text-slate-400">?campaign=</code> or <code className="text-slate-400">utm_campaign</code>.
                  </td>
                </tr>
              ) : (
                data.topCampaigns.map((r) => (
                  <tr key={r.campaign} className="border-b border-slate-800/80">
                    <td className="px-4 py-3 text-slate-200">{r.campaign}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{r.leads}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200">Tracked events (volume)</h2>
        <p className="mt-1 text-sm text-slate-500">Page views, CTA clicks, evaluation submits.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {["page_view", "CTA_clicked", "call_clicked", "whatsapp_clicked", "evaluation_started", "evaluation_submitted", "evaluation_submit"].map((k) => (
            <li
              key={k}
              className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-300"
            >
              <span className="font-medium text-slate-400">{k}</span>
              <span className="ml-2 text-lg font-semibold text-amber-300">
                {data.eventsByType[k] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
