"use client";

import type { MarketingCampaignAdminRow } from "@/types/marketing-campaign-admin-client";import { useCallback, useState } from "react";
import type { MontrealCampaignPreset } from "@/modules/ads/montreal-ready-campaigns";

export type CampaignRow = MarketingCampaignAdminRow & { trackedUrlFrCa: string | null };

type MontrealRow = MontrealCampaignPreset & { trackedUrlFrCa: string; trackedUrlEnCa: string };

type Props = {
  initialCampaigns: CampaignRow[];
  montrealPresets: MontrealRow[];
};

export function CampaignsAdminClient({ initialCampaigns, montrealPresets }: Props) {
  const [rows, setRows] = useState(initialCampaigns);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [landingPath, setLandingPath] = useState("/lp/host");
  const [utmSource, setUtmSource] = useState("google");
  const [utmMedium, setUtmMedium] = useState("cpc");
  const [utmCampaign, setUtmCampaign] = useState("lecipm_host_qc");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/campaigns", { cache: "no-store" });
    const j = (await res.json()) as { campaigns?: CampaignRow[] };
    if (j.campaigns) setRows(j.campaigns);
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug.trim() || undefined,
          landingPath,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Failed");
        return;
      }
      setName("");
      setSlug("");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  const qs = new URLSearchParams();
  if (utmSource) qs.set("utm_source", utmSource);
  if (utmMedium) qs.set("utm_medium", utmMedium);
  if (utmCampaign) qs.set("utm_campaign", utmCampaign);
  const example = `${landingPath || "/"}?${qs.toString()}`;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-6">
        <h2 className="text-lg font-semibold text-white">Montréal — Google Ads ready (v1)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Headlines, descriptions, keywords, targeting hints, and tracked landing URLs (`/fr/ca` + `/en/ca`). Paste into
          Google Ads; tune match types and bids in the UI.
        </p>
        <ul className="mt-4 space-y-6">
          {montrealPresets.map((p) => (
            <li key={p.id} className="rounded-xl border border-zinc-800 bg-black/40 p-4">
              <p className="font-semibold text-zinc-100">{p.name}</p>
              <p className="mt-1 text-sm text-zinc-500">{p.summary}</p>
              <p className="mt-2 text-xs text-zinc-600">
                <span className="text-zinc-400">utm_campaign:</span> {p.utmCampaign} ·{" "}
                <span className="text-zinc-400">LP:</span> {p.landingPath}
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <p className="text-zinc-500">FR Québec</p>
                <UrlCopyRow url={p.trackedUrlFrCa} />
                <p className="pt-1 text-zinc-500">EN Canada</p>
                <UrlCopyRow url={p.trackedUrlEnCa} />
              </div>
              <details className="mt-3 text-sm text-zinc-400">
                <summary className="cursor-pointer text-premium-gold/90">Keywords & copy</summary>
                <div className="mt-2 space-y-3 pl-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Keywords</p>
                    <p className="mt-1 text-zinc-500">{p.keywords.join(" · ")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Headlines</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-4">
                      {p.headlines.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Descriptions</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {p.descriptions.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-600">Targeting:</span> {p.targetingSuggestion}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={onCreate} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">New saved campaign</h2>
          {err ? (
            <p className="text-sm text-red-400" role="alert">
              {err}
            </p>
          ) : null}
          <label className="block text-sm text-zinc-400">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Slug (optional)
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto from name"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Landing path
            <input
              value={landingPath}
              onChange={(e) => setLandingPath(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-zinc-400">
              utm_source
              <input
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-zinc-400">
              utm_medium
              <input
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-zinc-400">
              utm_campaign
              <input
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-white"
              />
            </label>
          </div>
          <p className="text-xs text-zinc-600">Path + query preview: {example}</p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create campaign"}
          </button>
        </form>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Saved campaigns</h2>
          <ul className="mt-4 space-y-4 text-sm text-zinc-400">
            {rows.map((c) => (
              <li key={c.id} className="rounded-lg border border-zinc-800/80 p-3">
                <CampaignSavedRow campaign={c} />
              </li>
            ))}
            {rows.length === 0 ? <li className="text-zinc-600">No campaigns yet.</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UrlCopyRow({ url }: { url: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded bg-zinc-900 px-2 py-1 text-[11px] text-emerald-200/90">{url}</code>
      <button
        type="button"
        onClick={() => void navigator.clipboard.writeText(url)}
        className="shrink-0 rounded border border-zinc-600 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-premium-gold/50"
      >
        Copy
      </button>
    </div>
  );
}

/** Mirrors `getCampaignGrowthStats` JSON from GET /api/campaigns/[id]/stats (no server import in client). */
type CampaignGrowthStatsPayload = {
  utmCampaign: string | null;
  range: { start: string; end: string; days: number };
  counts: {
    pageViews: number;
    signups: number;
    logins: number;
    bookingsStarted: number;
    bookingsCompleted: number;
    brokerLeads: number;
  };
} | null;

function CampaignSavedRow({ campaign }: { campaign: CampaignRow }) {
  const [stats, setStats] = useState<CampaignGrowthStatsPayload>(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/stats?days=30`, { cache: "no-store" });
      const j = (await res.json()) as { stats: CampaignGrowthStatsPayload };
      setStats(j.stats);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="font-medium text-zinc-200">{campaign.name}</p>
      <p className="font-mono text-xs text-zinc-500">{campaign.slug}</p>
      <p className="mt-1 text-xs">
        {campaign.landingPath ?? "—"} · {campaign.utmSource ?? "?"} / {campaign.utmMedium ?? "?"} /{" "}
        {campaign.utmCampaign ?? "?"}
      </p>
      {campaign.trackedUrlFrCa ? (
        <div className="mt-2">
          <p className="text-xs text-zinc-600">Tracked (fr/ca)</p>
          <UrlCopyRow url={campaign.trackedUrlFrCa} />
        </div>
      ) : (
        <p className="mt-2 text-xs text-amber-600/90">Add utm_source, utm_medium, utm_campaign to generate URL.</p>
      )}
      <button
        type="button"
        onClick={() => void loadStats()}
        disabled={loading || !campaign.utmCampaign}
        className="mt-2 text-xs font-semibold text-premium-gold hover:underline disabled:opacity-40"
      >
        {loading ? "Loading stats…" : "Load growth_events stats (30d)"}
      </button>
      {stats?.counts ? (
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-500">
          <li>page_views: {stats.counts.pageViews}</li>
          <li>signups: {stats.counts.signups}</li>
          <li>logins: {stats.counts.logins}</li>
          <li>booking_started: {stats.counts.bookingsStarted}</li>
          <li>booking_completed: {stats.counts.bookingsCompleted}</li>
          <li>broker_lead: {stats.counts.brokerLeads}</li>
        </ul>
      ) : null}
    </div>
  );
}
