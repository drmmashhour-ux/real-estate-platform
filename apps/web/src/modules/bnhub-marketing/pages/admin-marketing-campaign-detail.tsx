"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignDetail } from "../types";
import { m } from "../components/marketing-ui-classes";
import { CampaignStatusBadge } from "../components/CampaignStatusBadge";
import { GeneratedCopyCard } from "../components/GeneratedCopyCard";
import { DistributionTimeline } from "../components/DistributionTimeline";
import { RecommendationCard } from "../components/RecommendationCard";
import { PerformanceStatCard } from "../components/PerformanceStatCard";
import { ChannelSelectorGrid, type ChannelOption } from "../components/ChannelSelectorGrid";
import { ScheduleCampaignModal } from "../components/ScheduleCampaignModal";

function sumMetrics(c: CampaignDetail) {
  return c.distributions.reduce(
    (acc, d) => {
      acc.impressions += d.impressions;
      acc.clicks += d.clicks;
      acc.bookings += d.bookings;
      acc.revenue += d.revenueAttributedCents;
      acc.spend += d.spendCents;
      return acc;
    },
    { impressions: 0, clicks: 0, bookings: 0, revenue: 0, spend: 0 }
  );
}

export function AdminMarketingCampaignDetail({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [lang, setLang] = useState<"all" | "en" | "fr">("all");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedCh, setSelectedCh] = useState<string[]>(["internal_homepage", "internal_search_boost"]);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}`);
      const j = (await r.json()) as CampaignDetail & { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Not found");
      setData(j as CampaignDetail);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bnhub/marketing/channels");
        const j = (await r.json()) as { channels: ChannelOption[] };
        if (r.ok) setChannels(j.channels);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const metrics = useMemo(() => (data ? sumMetrics(data) : null), [data]);

  const filteredAssets = useMemo(() => {
    if (!data) return [];
    if (lang === "all") return data.assets;
    return data.assets.filter((a) => a.languageCode === lang);
  }, [data, lang]);

  const publish = async (distributionId: string, action: string) => {
    setBusy(distributionId);
    try {
      const r = await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributionId, action }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Publish failed");
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

  if (err || !data) {
    return (
      <div className={m.card}>
        <p className="text-red-400">{err ?? "Loading…"}</p>
        <Link href="/admin/bnhub/marketing/campaigns" className={`${m.btnGhost} mt-4 inline-block`}>
          Back
        </Link>
      </div>
    );
  }

  const publishable = (code: string) => {
    const map: Record<string, string> = {
      internal_homepage: "internal_homepage",
      internal_search_boost: "internal_search_boost",
      internal_email: "internal_email",
      internal_blog_feed: "internal_blog_feed",
      instagram: "instagram",
      facebook: "facebook",
      tiktok: "tiktok",
      google_ads: "google_ads",
    };
    return map[code];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/bnhub/marketing/campaigns" className="text-sm text-amber-400 hover:text-amber-300">
            ← Campaigns
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">{data.campaignName}</h1>
          <p className="text-sm text-zinc-400">
            {data.listing.title} · {data.listing.city ?? "—"} ·{" "}
            <Link className="text-amber-400" href={`/admin/bnhub/marketing/listings/${data.listingId}`}>
              Marketing profile
            </Link>
          </p>
          <div className="mt-2">
            <CampaignStatusBadge status={data.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={m.btnGhost}
            disabled={!!busy}
            onClick={async () => {
              setBusy("gen");
              try {
                await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}/assets/generate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ langs: ["en", "fr"] }),
                });
                await load();
              } finally {
                setBusy(null);
              }
            }}
          >
            Regenerate EN+FR pack
          </button>
          <button
            type="button"
            className={m.btnGhost}
            disabled={!!busy}
            onClick={async () => {
              setBusy("dup");
              try {
                const r = await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}/duplicate`, {
                  method: "POST",
                });
                const j = (await r.json()) as { id?: string };
                if (j.id) window.location.href = `/admin/bnhub/marketing/campaigns/${j.id}`;
              } finally {
                setBusy(null);
              }
            }}
          >
            Duplicate
          </button>
          <button
            type="button"
            className={m.btnGhost}
            disabled={!!busy}
            onClick={async () => {
              setBusy("arch");
              await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ARCHIVED" }),
              });
              window.location.href = "/admin/bnhub/marketing/campaigns";
            }}
          >
            Archive
          </button>
        </div>
      </div>

      {metrics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PerformanceStatCard label="Impressions (sum)" value={metrics.impressions} hint="Internal + stored mocks" />
          <PerformanceStatCard label="Clicks" value={metrics.clicks} />
          <PerformanceStatCard label="Bookings attributed" value={metrics.bookings} hint="Partially simulated" />
          <PerformanceStatCard label="Revenue (¢)" value={metrics.revenue} />
          <PerformanceStatCard label="Spend (¢)" value={metrics.spend} />
        </div>
      ) : null}

      <div className={m.card}>
        <h2 className={m.title}>AI strategy</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{data.aiStrategySummary ?? "—"}</p>
      </div>

      <div className={m.card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className={m.title}>Content assets</h2>
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
        {filteredAssets.length === 0 ? <p className="text-sm text-zinc-500">No assets — run generate pack.</p> : null}
      </div>

      <div className={m.card}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className={m.title}>Distributions</h2>
          <button type="button" className={m.btnPrimary} onClick={() => setPlanOpen(true)}>
            Add channels
          </button>
        </div>
        <DistributionTimeline rows={data.distributions} />
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase text-zinc-500">Publish / mock send</p>
          {data.distributions.map((d) => {
            const act = publishable(d.channel.code);
            if (!act) return null;
            return (
              <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 p-2">
                <span className="text-xs text-zinc-400">{d.channel.code}</span>
                <button
                  type="button"
                  className={m.btnGhost}
                  disabled={busy === d.id}
                  onClick={() => void publish(d.id, act)}
                >
                  {busy === d.id ? "…" : d.distributionStatus === "PUBLISHED" ? "Re-run mock" : "Publish (mock)"}
                </button>
                {d.channel.code === "internal_search_boost" ? (
                  <button
                    type="button"
                    className={m.btnGhost}
                    disabled={busy === d.id}
                    onClick={async () => {
                      setBusy(d.id);
                      try {
                        await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}/publish`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            distributionId: d.id,
                            action: "internal_search_boost",
                            boostPoints: 10,
                          }),
                        });
                        await load();
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    Boost +10 (capped)
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className={m.card}>
        <h2 className={m.title}>Recommendations</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.recommendations.map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}
        </div>
        {data.recommendations.length === 0 ? <p className="text-sm text-zinc-500">No open recommendations.</p> : null}
      </div>

      <div className={m.card}>
        <h2 className={m.title}>Activity</h2>
        <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
          {data.events.map((ev) => (
            <li key={ev.id} className="border-b border-zinc-800/80 pb-2">
              <span className="text-amber-500/90">{ev.eventType}</span>{" "}
              <span className="text-zinc-500">· {ev.eventSource}</span>
              <span className="ml-2 text-zinc-400">{new Date(ev.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <ScheduleCampaignModal
        open={planOpen}
        title="Add distribution channels"
        onClose={() => setPlanOpen(false)}
        busy={busy === "plan"}
        onConfirm={async () => {
          setBusy("plan");
          try {
            const r = await fetch(`/api/admin/bnhub-marketing/campaigns/${campaignId}/distributions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ channelCodes: selectedCh }),
            });
            const j = (await r.json()) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? "Failed");
            setPlanOpen(false);
            await load();
          } finally {
            setBusy(null);
          }
        }}
        confirmLabel="Create plan rows"
      >
        <ChannelSelectorGrid channels={channels} selected={selectedCh} onChange={setSelectedCh} />
      </ScheduleCampaignModal>
    </div>
  );
}
