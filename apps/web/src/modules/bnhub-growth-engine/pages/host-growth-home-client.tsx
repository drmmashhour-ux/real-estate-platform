"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LaunchCampaignWizard } from "../components/LaunchCampaignWizard";
import { g } from "../components/growth-ui-classes";

type Overview = {
  listings: { id: string; title: string; city: string | null }[];
  campaigns: { id: string; campaignName: string; status: string }[];
  stats: { total: number; hot: number };
};

export function HostGrowthHomeClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/bnhub/host/growth/overview");
      if (r.status === 401) {
        window.location.href = "/bnhub/login";
        return;
      }
      const j = (await r.json()) as Overview & { error?: string };
      if (!r.ok) setErr(j.error ?? "Failed");
      else setData(j);
    })();
  }, []);

  if (err) return <p className="text-red-400">{err}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;

  const noListings = data.listings.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Growth & leads</h1>
        <p className={g.sub}>
          Internal homepage, search boost, and promo flows are live. Meta/Google/TikTok remain{" "}
          <span className="text-amber-200/90">mock or pending</span> until ops finishes connector setup.
        </p>
      </div>
      {noListings ? (
        <div className={`${g.card} border-amber-500/20`}>
          <p className={g.title}>No listings yet</p>
          <p className={g.sub}>
            Publish a BNHub listing first. Growth campaigns attach to a live property; internal placements never spend on
            external ads.
          </p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={g.card}>
          <p className={g.sub}>Your leads</p>
          <p className="text-2xl font-bold text-amber-400">{data.stats.total}</p>
        </div>
        <div className={g.card}>
          <p className={g.sub}>Hot</p>
          <p className="text-2xl font-bold text-red-300">{data.stats.hot}</p>
        </div>
        <div className={g.card}>
          <p className={g.sub}>Campaigns</p>
          <p className="text-2xl font-bold text-white">{data.campaigns.length}</p>
        </div>
      </div>
      <div className={g.card}>
        <h2 className={g.title}>Campaigns</h2>
        {data.campaigns.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No campaigns yet — use the wizard below to create a draft.</p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-800">
            {data.campaigns.map((c) => (
              <li key={c.id} className="py-2">
                <Link href={`/bnhub/host/growth/campaigns/${c.id}`} className="text-amber-400 hover:text-amber-300">
                  {c.campaignName}
                </Link>
                <span className="ml-2 text-xs text-zinc-500">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!noListings ? <LaunchCampaignWizard listings={data.listings} /> : null}
    </div>
  );
}
