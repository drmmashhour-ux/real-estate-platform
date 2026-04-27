"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import type { BrokerIntelligenceInsight } from "@/lib/broker/intelligence";
import { trackEvent } from "@/src/services/analytics";
import { X, Copy, RefreshCw, Rocket } from "lucide-react";

type AdCopyResponse = {
  audience: string;
  city?: string;
  headline: string;
  body: string;
  channels: {
    tiktok: { hook: string; caption: string };
    meta: { headline: string; body: string };
    google: { headlines: [string, string]; description: string };
  };
};

type LaunchPlatform = "tiktok" | "meta" | "google";

const API_AUDIENCES = new Set(["buyer", "seller", "host", "broker"]);
function campaignAudienceForApi(audience: string | undefined) {
  const a = (audience ?? "buyer").toLowerCase();
  if (API_AUDIENCES.has(a)) {
    return a as "buyer" | "seller" | "host" | "broker";
  }
  return "buyer" as const;
}

type Props = {
  insights: BrokerIntelligenceInsight[];
  /**
   * Set from a server parent: `recommendationsEnabled={flags.RECOMMENDATIONS}`.
   * Client components cannot read `FEATURE_RECO` from `lib/flags` reliably.
   */
  recommendationsEnabled?: boolean;
  /**
   * `autonomousAgentEnabled={flags.AUTONOMOUS_AGENT}` — show **Launch Campaign** in the ad modal.
   */
  autonomousAgentEnabled?: boolean;
  /** Defaults to marketplace path; set when embedded under `[locale]/[country]`. */
  campaignsDashboardHref?: string;
};

function copyForPlatform(d: AdCopyResponse, p: LaunchPlatform) {
  if (p === "tiktok") {
    return { headline: d.channels.tiktok.hook, body: d.channels.tiktok.caption };
  }
  if (p === "meta") {
    return { headline: d.channels.meta.headline, body: d.channels.meta.body };
  }
  return {
    headline: [d.channels.google.headlines[0], d.channels.google.headlines[1]].filter(Boolean).join(" · "),
    body: d.channels.google.description,
  };
}

function SectionCopy({
  label,
  text,
  className = "",
}: {
  label: string;
  text: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copy
        </button>
      </div>
      <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

export function BrokerIntelligencePanel({
  insights,
  recommendationsEnabled = false,
  autonomousAgentEnabled = false,
  campaignsDashboardHref = "/dashboard/broker/campaigns",
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ad, setAd] = useState<AdCopyResponse | null>(null);
  const [contextInsight, setContextInsight] = useState<BrokerIntelligenceInsight | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [launchPlatform, setLaunchPlatform] = useState<LaunchPlatform>("meta");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [launchedId, setLaunchedId] = useState<string | null>(null);

  const handleGenerateAd = useCallback(
    async (insight: BrokerIntelligenceInsight, isRegenerate?: boolean) => {
      setError(null);
      if (!isRegenerate) {
        setContextInsight(insight);
        setAd(null);
      }
      setOpen(true);
      setGeneratingId(insight.listingId);
      try {
        const res = await fetch("/api/marketing/ad-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audience: insight.audience ?? "buyer",
            city: insight.city,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError((err as { error?: string }).error ?? `Request failed (${res.status})`);
          return;
        }
        const data = (await res.json()) as AdCopyResponse;
        setAd(data);
        void trackEvent(
          "ad_generated",
          {
            audience: insight.audience ?? "buyer",
            city: insight.city,
            insightType: insight.type,
            regenerate: Boolean(isRegenerate),
          },
          {}
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
      } finally {
        setGeneratingId(null);
      }
    },
    []
  );

  const handleLaunchCampaign = useCallback(async () => {
    if (!ad || !contextInsight) return;
    setLaunchError(null);
    setLaunching(true);
    setLaunchedId(null);
    try {
      const { headline, body: bodyText } = copyForPlatform(ad, launchPlatform);
      const res = await fetch("/api/marketing/campaign/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: campaignAudienceForApi(contextInsight.audience),
          city: contextInsight.city,
          platform: launchPlatform,
          headline,
          body: bodyText,
          createdBy: "broker" as const,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setLaunchError(j.error ?? "Create failed");
        return;
      }
      const j = (await res.json()) as { campaign: { id: string } };
      setLaunchedId(j.campaign.id);
      void trackEvent("campaign_created", {
        campaignId: j.campaign.id,
        platform: launchPlatform,
        audience: campaignAudienceForApi(contextInsight.audience),
        city: contextInsight.city,
        insightType: contextInsight.type,
      });
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLaunching(false);
    }
  }, [ad, contextInsight, launchPlatform]);

  return (
    <section className="rounded-2xl border p-6">
      <h2 className="text-2xl font-semibold">Broker Intelligence</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Performance signals and recommended actions for your listings.
      </p>
      <div className="mt-6 space-y-4">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listing signals yet for this range.</p>
        ) : (
          insights.map((item) => (
            <div key={item.listingId} className="flex flex-col gap-3 rounded-xl border p-4">
              <div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm">Conversion rate: {(item.conversionRate * 100).toFixed(2)}%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Status: {item.status} · {item.bookings} bookings / {item.views} views
                  {item.city ? ` · ${item.city}` : ""}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.recommendation}</p>
              </div>
              {recommendationsEnabled ? (
                <div>
                  <button
                    type="button"
                    disabled={generatingId === item.listingId}
                    onClick={() => {
                      void handleGenerateAd(item);
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                  >
                    {generatingId === item.listingId ? "Generating…" : "Generate Campaign"}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ad-copy-modal-title"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                }}
              />
              <div className="relative z-[101] max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <h3 id="ad-copy-modal-title" className="text-lg font-semibold">
                    Campaign copy
                  </h3>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      setOpen(false);
                    }}
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
                {generatingId && !ad && !error ? (
                  <p className="mt-4 text-sm text-muted-foreground">Generating copy…</p>
                ) : null}
                {generatingId && ad ? (
                  <p className="mt-3 text-sm text-muted-foreground">Regenerating…</p>
                ) : null}
                {ad ? (
                  <div className="mt-4 space-y-6">
                    <p className="text-xs text-muted-foreground">
                      Audience: {ad.audience}
                      {ad.city ? ` · ${ad.city}` : ""}
                    </p>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">TikTok</p>
                      <SectionCopy
                        label="Hook"
                        text={ad.channels.tiktok.hook}
                        className="pl-0"
                      />
                      <SectionCopy
                        label="Caption"
                        text={ad.channels.tiktok.caption}
                        className="pl-0"
                      />
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                      <p className="text-sm font-medium">Meta</p>
                      <SectionCopy label="Headline" text={ad.channels.meta.headline} className="pl-0" />
                      <SectionCopy label="Body" text={ad.channels.meta.body} className="pl-0" />
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                      <p className="text-sm font-medium">Google</p>
                      <SectionCopy
                        label="Headline 1"
                        text={ad.channels.google.headlines[0]}
                        className="pl-0"
                      />
                      <SectionCopy
                        label="Headline 2"
                        text={ad.channels.google.headlines[1]}
                        className="pl-0"
                      />
                      <SectionCopy
                        label="Description"
                        text={ad.channels.google.description}
                        className="pl-0"
                      />
                    </div>
                    {autonomousAgentEnabled && contextInsight ? (
                      <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-sm font-medium">Launch (simulation)</p>
                        <p className="text-xs text-muted-foreground">
                          Saves a draft campaign — no real ad spend. Run the simulation from the campaigns dashboard.
                        </p>
                        {launchError ? <p className="text-sm text-destructive">{launchError}</p> : null}
                        {launchedId ? (
                          <p className="text-sm text-emerald-600">
                            Campaign saved.{" "}
                            <Link href={campaignsDashboardHref} className="font-medium underline">
                              Open campaigns
                            </Link>
                          </p>
                        ) : null}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <label className="text-xs font-medium text-muted-foreground" htmlFor="launch-platform">
                            Platform
                          </label>
                          <select
                            id="launch-platform"
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                            value={launchPlatform}
                            onChange={(e) => {
                              setLaunchPlatform(e.target.value as LaunchPlatform);
                            }}
                          >
                            <option value="tiktok">TikTok</option>
                            <option value="meta">Meta</option>
                            <option value="google">Google</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          disabled={launching}
                          onClick={() => {
                            void handleLaunchCampaign();
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
                        >
                          <Rocket className="h-4 w-4" aria-hidden />
                          {launching ? "Saving…" : "Launch Campaign"}
                        </button>
                      </div>
                    ) : null}
                    {recommendationsEnabled && contextInsight ? (
                      <div className="border-t border-border pt-4">
                        <button
                          type="button"
                          disabled={generatingId !== null || !contextInsight}
                          onClick={() => {
                            if (contextInsight) void handleGenerateAd(contextInsight, true);
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden />
                          Regenerate
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
