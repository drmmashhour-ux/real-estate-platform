"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignDetail } from "../types";
import { m } from "../components/marketing-ui-classes";
import { CampaignStatusBadge } from "../components/CampaignStatusBadge";
import { GeneratedCopyCard } from "../components/GeneratedCopyCard";
import { DistributionTimeline } from "../components/DistributionTimeline";
import { ChannelSelectorGrid, type ChannelOption } from "../components/ChannelSelectorGrid";
import { PerformanceStatCard } from "../components/PerformanceStatCard";

function sumMetrics(c: CampaignDetail) {
  return c.distributions.reduce(
    (acc, d) => {
      acc.impressions += d.impressions;
      acc.clicks += d.clicks;
      acc.bookings += d.bookings;
      return acc;
    },
    { impressions: 0, clicks: 0, bookings: 0 }
  );
}

export function HostMarketingCampaignDetail({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [lang, setLang] = useState<"all" | "en" | "fr">("all");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedCh, setSelectedCh] = useState<string[]>(["internal_homepage"]);

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch(`/api/bnhub/host/marketing/campaigns/${campaignId}`);
    if (r.status === 401) {
      window.location.href = "/bnhub/login";
      return;
    }
    const j = (await r.json()) as CampaignDetail & { error?: string };
    if (!r.ok) {
      setErr(j.error ?? "Not found");
      return;
    }
    setData(j as CampaignDetail);
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/bnhub/marketing/channels");
      const j = (await r.json()) as { channels: ChannelOption[] };
      if (r.ok) setChannels(j.channels);
    })();
  }, []);

  const metrics = useMemo(() => (data ? sumMetrics(data) : null), [data]);

  const filteredAssets = useMemo(() => {
    if (!data) return [];
    if (lang === "all") return data.assets;
    return data.assets.filter((a) => a.languageCode === lang);
  }, [data, lang]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy("patch");
    try {
      const r = await fetch(`/api/bnhub/host/marketing/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Failed");
      await load();
    } finally {
      setBusy(null);
    }
  };

  const saveAsset = async (id: string, content: string) => {
    const r = await fetch(`/api/bnhub/marketing/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!r.ok) throw new Error("Save failed");
    await load();
  };

  const publishFirst = (action: "internal_homepage" | "internal_search_boost" | "internal_email") => {
    const row = data?.distributions.find((d) => {
      const code = d.channel.code;
      if (action === "internal_homepage") return code === "internal_homepage";
      if (action === "internal_search_boost") return code === "internal_search_boost";
      return code === "internal_email";
    });
    if (!row) return;
    void patch({ publish: { distributionId: row.id, action } });
  };

  if (err || !data) {
    return (
      <div className={m.card}>
        <p className="text-red-400">{err ?? "Loading…"}</p>
        <Link href="/bnhub/host/marketing" className={`${m.btnGhost} mt-4 inline-block`}>
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/bnhub/host/marketing" className="text-sm text-amber-400 hover:text-amber-300">
          ← Marketing home
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">{data.campaignName}</h1>
        <p className="text-sm text-zinc-400">{data.listing.title}</p>
        <div className="mt-2">
          <CampaignStatusBadge status={data.status} />
        </div>
      </div>

      {metrics ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <PerformanceStatCard label="Impressions" value={metrics.impressions} hint="Stored metrics" />
          <PerformanceStatCard label="Clicks" value={metrics.clicks} />
          <PerformanceStatCard label="Bookings" value={metrics.bookings} hint="Est." />
        </div>
      ) : null}

      <div className={`${m.card} flex flex-wrap gap-2`}>
        <button type="button" className={m.btnPrimary} disabled={!!busy} onClick={() => void patch({ generateAssets: true })}>
          {busy ? "…" : "Generate AI pack"}
        </button>
        <button type="button" className={m.btnGhost} disabled={!!busy} onClick={() => void publishFirst("internal_homepage")}>
          Publish homepage (internal)
        </button>
        <button type="button" className={m.btnGhost} disabled={!!busy} onClick={() => void publishFirst("internal_search_boost")}>
          Apply search boost
        </button>
        <button type="button" className={m.btnGhost} disabled={!!busy} onClick={() => void publishFirst("internal_email")}>
          Queue email card (internal)
        </button>
      </div>

      <div className={m.card}>
        <h2 className={m.title}>Add channels to plan</h2>
        <ChannelSelectorGrid channels={channels} selected={selectedCh} onChange={setSelectedCh} disabled={!!busy} />
        <button
          type="button"
          className={`${m.btnGhost} mt-4`}
          disabled={!!busy}
          onClick={() => void patch({ planChannels: selectedCh })}
        >
          {busy ? "…" : "Update distribution plan"}
        </button>
      </div>

      <div className={m.card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className={m.title}>Assets</h2>
          <div className="flex gap-2">
            {(["all", "en", "fr"] as const).map((l) => (
              <button
                key={l}
                type="button"
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  lang === l ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredAssets.map((a) => (
            <GeneratedCopyCard key={a.id} asset={a} onSave={saveAsset} />
          ))}
        </div>
        {filteredAssets.length === 0 ? <p className="text-sm text-zinc-500">Generate pack to see copy.</p> : null}
      </div>

      <div className={m.card}>
        <h2 className={m.title}>Distributions</h2>
        <DistributionTimeline rows={data.distributions} />
      </div>
    </div>
  );
}
