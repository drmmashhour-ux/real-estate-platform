"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ListingMarketingBundle } from "../types";
import { m } from "../components/marketing-ui-classes";
import { MarketingReadinessCard } from "../components/MarketingReadinessCard";
import { MarketingAngleSelector } from "../components/MarketingAngleSelector";
import { RecommendationCard } from "../components/RecommendationCard";
import { PerformanceStatCard } from "../components/PerformanceStatCard";
import { ExportPromoPanel } from "../components/ExportPromoPanel";

export function AdminMarketingListing({ listingId }: { listingId: string }) {
  const [bundle, setBundle] = useState<ListingMarketingBundle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(`/api/admin/bnhub-marketing/listings/${listingId}`);
      const j = (await r.json()) as ListingMarketingBundle & { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setBundle({
        profile: j.profile,
        recommendations: j.recommendations,
        stats: j.stats,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/bnhub-marketing/listings/${listingId}`, { method: "POST" });
      const j = (await r.json()) as ListingMarketingBundle & { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setBundle({
        profile: j.profile,
        recommendations: j.recommendations,
        stats: j.stats,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (err && !bundle) {
    return (
      <div className={m.card}>
        <p className="text-red-400">{err}</p>
        <Link href="/admin/bnhub/marketing" className={`${m.btnGhost} mt-4 inline-block`}>
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/bnhub/marketing" className="text-sm text-amber-400 hover:text-amber-300">
          ← Marketing home
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Listing marketing</h1>
        <p className="font-mono text-sm text-zinc-500">{listingId}</p>
      </div>

      {bundle?.stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PerformanceStatCard label="Campaigns" value={bundle.stats.campaigns} />
          <PerformanceStatCard label="Impressions" value={bundle.stats.impressions} hint="Aggregated" />
          <PerformanceStatCard label="Clicks" value={bundle.stats.clicks} />
          <PerformanceStatCard label="Bookings" value={bundle.stats.bookings} hint="Est. / attributed" />
        </div>
      ) : null}

      <MarketingReadinessCard profile={bundle?.profile ?? null} onRefresh={refresh} busy={busy} />
      <MarketingAngleSelector angle={bundle?.profile?.recommendedAngle} />

      <ExportPromoPanel listingId={listingId} />

      <div className={m.card}>
        <h2 className={m.title}>Recommendations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(bundle?.recommendations ?? []).map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}
        </div>
        {(bundle?.recommendations ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">Run refresh to generate rules-based recommendations.</p>
        ) : null}
      </div>
    </div>
  );
}
