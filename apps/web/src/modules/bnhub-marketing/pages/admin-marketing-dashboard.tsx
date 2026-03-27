"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MarketingOverviewResponse } from "../types";
import type { CampaignListRow } from "../types";
import { m } from "../components/marketing-ui-classes";
import { PerformanceStatCard } from "../components/PerformanceStatCard";
import { CampaignStatusBadge } from "../components/CampaignStatusBadge";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const j = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error((j as { error?: string }).error ?? r.statusText);
  return j as T;
}

export function AdminMarketingDashboard() {
  const [overview, setOverview] = useState<MarketingOverviewResponse | null>(null);
  const [recent, setRecent] = useState<CampaignListRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [o, c] = await Promise.all([
          fetchJson<MarketingOverviewResponse>("/api/admin/bnhub-marketing/overview"),
          fetchJson<{ campaigns: CampaignListRow[] }>("/api/admin/bnhub-marketing/campaigns?take=8"),
        ]);
        if (!cancelled) {
          setOverview(o);
          setRecent(c.campaigns);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-800/80" />
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className={m.card}>
        <p className="text-red-400">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">BNHub Marketing Engine</h1>
          <p className={m.subtitle}>Global distribution & AI content — internal-first, external adapters mocked.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/bnhub/marketing/campaigns" className={m.btnPrimary}>
            All campaigns
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PerformanceStatCard label="Total campaigns" value={overview?.totalCampaigns ?? 0} />
        <PerformanceStatCard label="Active" value={overview?.activeCampaigns ?? 0} />
        <PerformanceStatCard
          label="Est. reach"
          value={overview?.estimatedReach?.toLocaleString() ?? "0"}
          hint={overview?.labels.reach}
        />
        <PerformanceStatCard
          label="High-priority recs"
          value={overview?.recommendationAlerts ?? 0}
          hint="Open · high/critical"
        />
      </div>

      <div className={m.card}>
        <h2 className={m.title}>Channel mix (DB aggregates)</h2>
        <p className="mb-4 text-xs text-amber-500/80">External rows may show mock metrics until adapters are live.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="pb-2 pr-4">Channel</th>
                <th className="pb-2 pr-4">Impressions</th>
                <th className="pb-2 pr-4">Clicks</th>
                <th className="pb-2">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.channelPerf ?? []).map((row) => (
                <tr key={row.channel} className="border-b border-zinc-800/80">
                  <td className="py-2 pr-4 font-mono text-xs text-amber-200/90">{row.channel}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.impressions}</td>
                  <td className="py-2 pr-4 tabular-nums">{row.clicks}</td>
                  <td className="py-2 tabular-nums">{row.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!overview?.channelPerf || overview.channelPerf.length === 0) && (
            <p className="py-6 text-center text-sm text-zinc-500">No distribution metrics yet.</p>
          )}
        </div>
      </div>

      <div className={m.card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={m.title}>Recent campaigns</h2>
          <Link href="/admin/bnhub/marketing/campaigns" className={`${m.btnGhost} text-xs`}>
            View all
          </Link>
        </div>
        <ul className="divide-y divide-zinc-800/80">
          {recent.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <Link href={`/admin/bnhub/marketing/campaigns/${c.id}`} className="font-medium text-white hover:text-amber-400">
                  {c.campaignName}
                </Link>
                <p className="text-xs text-zinc-500">
                  {c.listing.title} · {c.listing.city ?? "—"}
                </p>
              </div>
              <CampaignStatusBadge status={c.status} />
            </li>
          ))}
        </ul>
        {recent.length === 0 ? <p className="text-sm text-zinc-500">No campaigns — create one from the campaigns list.</p> : null}
      </div>
    </div>
  );
}
