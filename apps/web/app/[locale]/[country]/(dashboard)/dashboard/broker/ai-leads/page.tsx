"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BehaviorActivity = {
  searchEvents: number;
  listingViews: number;
  savedListings: number;
  messagesSent: number;
  repeatVisitDays: number;
};

type LeadRow = {
  id: string;
  name: string;
  score: number;
  temperature: "hot" | "warm" | "cold";
  temperatureEmoji?: string;
  explanation?: string;
  recommendedActions?: string[];
  status: string;
  behaviorActivity: BehaviorActivity | null;
  listingCode?: string | null;
  listingId?: string | null;
};

type TierSummary = { hot: number; warm: number; cold: number };

export default function BrokerAiLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tierSummary, setTierSummary] = useState<TierSummary | null>(null);
  const [recent, setRecent] = useState<
    {
      leadId: string;
      name: string;
      score: number;
      tier: string;
      tierEmoji?: string;
      suggestedNext: string;
      listingCode?: string | null;
      listingId?: string | null;
    }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/broker/ai/leads-dashboard", { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error ?? "Unable to load");
          return;
        }
        setLeads(Array.isArray(d.leads) ? d.leads : []);
        setTierSummary(d.tierSummary ?? null);
        setRecent(Array.isArray(d.recentActivity) ? d.recentActivity : []);
      })
      .catch(() => setError("Network error"));
  }, []);

  function activityLine(a: BehaviorActivity | null): string {
    if (!a) return "— (link lead to platform user for behavior)";
    return `${a.searchEvents} searches · ${a.listingViews} views · ${a.savedListings} saves · ${a.messagesSent} msgs · ${a.repeatVisitDays} active days`;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
        ← Broker hub
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">AI lead scoring</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Leads are scored from <strong className="text-slate-300">form signals</strong> merged with{" "}
        <strong className="text-slate-300">behavior</strong> (searches, listing views, saves, messages — last 30 days).
        Tiers: 🔥 hot (80–100), 🌡️ warm (50–79), ❄️ cold (0–49). Rule-based, not ML.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </p>
      )}

      {tierSummary && !error && (
        <div className="mt-8 flex flex-wrap gap-3">
          <div className="rounded-xl border border-orange-500/35 bg-orange-500/10 px-5 py-3">
            <p className="text-xs font-medium uppercase text-orange-200/80">Hot</p>
            <p className="text-2xl font-semibold text-white">{tierSummary.hot}</p>
          </div>
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-5 py-3">
            <p className="text-xs font-medium uppercase text-amber-200/80">Warm</p>
            <p className="text-2xl font-semibold text-white">{tierSummary.warm}</p>
          </div>
          <div className="rounded-xl border border-sky-500/35 bg-sky-500/10 px-5 py-3">
            <p className="text-xs font-medium uppercase text-sky-200/80">Cold</p>
            <p className="text-2xl font-semibold text-white">{tierSummary.cold}</p>
          </div>
        </div>
      )}

      <section className="mt-10 overflow-x-auto">
        <h2 className="text-lg font-medium text-emerald-300">All scored leads</h2>
        <p className="mb-3 text-xs text-slate-500">Sorted by score (highest first). Behavior appears when the lead matches a signed-in user.</p>
        <table className="mt-2 w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-xs uppercase text-slate-500">
              <th className="py-3 pr-4 font-medium">Lead / listing</th>
              <th className="py-3 pr-4 font-medium">Tier</th>
              <th className="py-3 pr-4 font-medium">Score</th>
              <th className="py-3 pr-4 font-medium">Activity (30d)</th>
              <th className="py-3 font-medium">Suggested action</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="py-8 text-slate-500">
                  No leads in your pipeline yet.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="border-b border-slate-800/80">
                <td className="py-3 pr-4 font-medium text-slate-100">{l.name}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-lg bg-slate-800/80 px-2 py-1 text-xs">
                    {l.temperatureEmoji ?? ""} {l.temperature}
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums text-slate-200">{l.score}</td>
                <td className="py-3 pr-4 text-xs text-slate-400">{activityLine(l.behaviorActivity)}</td>
                <td className="py-3 text-xs text-emerald-200/90">{l.recommendedActions?.[0] ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-slate-200">Priority queue</h2>
        <p className="mb-3 text-xs text-slate-500">Top leads by score with next-step hint.</p>
        <ul className="space-y-2 text-sm text-slate-400">
          {recent.length === 0 && !error && <li className="text-slate-500">No recent entries.</li>}
          {recent.map((r) => (
            <li key={r.leadId} className="flex flex-wrap items-baseline gap-x-2 border-b border-slate-800/60 py-2">
              <span className="font-medium text-slate-200">
                {r.tierEmoji} {r.name}
              </span>
              {r.listingCode ? (
                <>
                  <span className="text-slate-500">·</span>
                  <Link
                    href={`/bnhub/${encodeURIComponent(r.listingCode)}`}
                    className="font-mono text-xs text-slate-500 hover:text-emerald-400"
                  >
                    {r.listingCode}
                  </Link>
                </>
              ) : null}
              <span className="text-slate-500">·</span>
              <span>
                {r.tier} · score {r.score}
              </span>
              <span className="text-slate-500">—</span>
              <span className="text-emerald-300/90">{r.suggestedNext}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
