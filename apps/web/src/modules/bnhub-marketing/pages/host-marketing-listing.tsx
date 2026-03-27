"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ListingMarketingBundle } from "../types";
import { m } from "../components/marketing-ui-classes";
import { MarketingReadinessCard } from "../components/MarketingReadinessCard";
import { MarketingAngleSelector } from "../components/MarketingAngleSelector";
import { RecommendationCard } from "../components/RecommendationCard";
import { ExportPromoPanel } from "../components/ExportPromoPanel";
import { PerformanceStatCard } from "../components/PerformanceStatCard";
import { ScheduleCampaignModal } from "../components/ScheduleCampaignModal";
import type { BnhubMarketingCampaignObjective } from "@prisma/client";

export function HostMarketingListing({ listingId }: { listingId: string }) {
  const [bundle, setBundle] = useState<ListingMarketingBundle | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostNote, setBoostNote] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/bnhub/host/marketing/listings/${listingId}`);
    if (r.status === 401) {
      window.location.href = "/bnhub/login";
      return;
    }
    const j = (await r.json()) as ListingMarketingBundle & { error?: string };
    if (!r.ok) {
      setErr(j.error ?? "Failed");
      return;
    }
    setBundle({ profile: j.profile, recommendations: j.recommendations, stats: j.stats });
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/bnhub/host/marketing/listings/${listingId}`, { method: "POST" });
      const j = (await r.json()) as ListingMarketingBundle & { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setBundle({ profile: j.profile, recommendations: j.recommendations, stats: j.stats });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const dismissRec = async (id: string) => {
    await fetch(`/api/bnhub/host/marketing/recommendations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss" }),
    });
    await load();
  };

  const applyRec = async (id: string) => {
    await fetch(`/api/bnhub/host/marketing/recommendations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "apply" }),
    });
    await load();
  };

  const quickCampaign = async () => {
    setBusy(true);
    try {
      const objective: BnhubMarketingCampaignObjective = "BOOKING_CONVERSION";
      const r = await fetch("/api/bnhub/host/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          campaignName: `Promotion — ${new Date().toLocaleDateString()}`,
          objective,
        }),
      });
      const j = (await r.json()) as { id?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      if (j.id) {
        await fetch(`/api/bnhub/host/marketing/campaigns/${j.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generateAssets: true,
            planChannels: ["internal_homepage", "internal_search_boost"],
          }),
        });
        window.location.href = `/bnhub/host/marketing/campaigns/${j.id}`;
      }
    } finally {
      setBusy(false);
    }
  };

  if (err && !bundle) {
    return (
      <div className={m.card}>
        <p className="text-red-400">{err}</p>
        <Link href="/bnhub/host/marketing" className={`${m.btnGhost} mt-4 inline-block`}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/bnhub/host/marketing" className="text-sm text-amber-400 hover:text-amber-300">
            ← Marketing home
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">Listing promotion</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={m.btnPrimary} disabled={busy} onClick={() => void quickCampaign()}>
            {busy ? "…" : "Generate promotion pack"}
          </button>
          <button type="button" className={m.btnGhost} onClick={() => setBoostOpen(true)}>
            Request admin boost
          </button>
        </div>
      </div>

      {bundle?.stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PerformanceStatCard label="Campaigns" value={bundle.stats.campaigns} />
          <PerformanceStatCard label="Impressions" value={bundle.stats.impressions} hint="Internal + stored" />
          <PerformanceStatCard label="Clicks" value={bundle.stats.clicks} />
          <PerformanceStatCard label="Bookings" value={bundle.stats.bookings} hint="Est." />
        </div>
      ) : null}

      <MarketingReadinessCard profile={bundle?.profile ?? null} onRefresh={refresh} busy={busy} />
      <MarketingAngleSelector angle={bundle?.profile?.recommendedAngle} />
      <ExportPromoPanel listingId={listingId} />

      <div className={m.card}>
        <h2 className={m.title}>Recommendations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(bundle?.recommendations ?? []).map((r) => (
            <RecommendationCard
              key={r.id}
              rec={r}
              onDismiss={(id) => void dismissRec(id)}
              onApply={(id) => void applyRec(id)}
            />
          ))}
        </div>
        {(bundle?.recommendations ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">Refresh readiness to populate suggestions.</p>
        ) : null}
      </div>

      <ScheduleCampaignModal
        open={boostOpen}
        title="Request homepage / search boost"
        onClose={() => setBoostOpen(false)}
        busy={false}
        confirmLabel="Submit note (copy for admin)"
        onConfirm={async () => {
          await navigator.clipboard.writeText(
            `BNHub boost review\nListing: ${listingId}\nHost note: ${boostNote || "(none)"}\n— sent via BNHub Marketing UI`
          );
          setBoostOpen(false);
          setBoostNote("");
        }}
      >
        <p className="text-sm text-zinc-400">
          Internal workflow: your note is copied to the clipboard — paste it in your admin thread or ticket. Automated
          routing can be added later.
        </p>
        <textarea
          className={`${m.input} mt-3 min-h-[100px]`}
          value={boostNote}
          onChange={(e) => setBoostNote(e.target.value)}
          placeholder="Why should this listing be boosted?"
        />
      </ScheduleCampaignModal>
    </div>
  );
}
