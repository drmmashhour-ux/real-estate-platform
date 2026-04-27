"use client";

import { useState } from "react";

import { trackEvent } from "@/src/services/analytics";

type Insight = {
  campaignId: string;
  platform: "tiktok" | "meta" | "google";
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
  recommendation: "scale_budget" | "pause_campaign" | "improve_copy" | "keep_running";
  suggestedAction: string;
  reason: string;
};

type AdCopy = {
  headline: string;
  body: string;
  audience: string;
  channels: {
    tiktok: { hook: string; caption: string };
    meta: { headline: string; body: string };
    google: { headlines: [string, string]; description: string };
  };
};

type OptimizeResult = {
  insight: Insight;
  dryRun: boolean;
  applied: boolean;
  adCopySuggestion?: AdCopy;
};

type CampaignOption = { id: string; label: string };

export function CampaignOptimizationSection({
  initialInsights,
  campaigns,
  featureEnabled,
}: {
  initialInsights: Insight[];
  campaigns: CampaignOption[];
  featureEnabled: boolean;
}) {
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id ?? "");
  const [insight, setInsight] = useState<Insight | null>(
    () => initialInsights.find((i) => i.campaignId === selectedId) ?? initialInsights[0] ?? null
  );
  const [lastResult, setLastResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function bestInsightFor(id: string) {
    return initialInsights.find((i) => i.campaignId === id) ?? null;
  }

  if (!featureEnabled) {
    return (
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">AI optimization (simulation)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Autonomous optimization is disabled.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable <code className="font-mono">FEATURE_AI_AGENT=1</code> to see optimization recommendations.
        </p>
      </section>
    );
  }

  async function runOptimize(dryRun: boolean) {
    if (!selectedId) {
      setError("Select a campaign");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/campaign/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: selectedId, dryRun }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Request failed");
        return;
      }
      const data = (await res.json()) as OptimizeResult;
      setLastResult(data);
      setInsight(data.insight);
      void trackEvent("campaign_optimization_generated", {
        campaignId: selectedId,
        recommendation: data.insight.recommendation,
        dryRun,
      });
      if (!dryRun && data.applied) {
        void trackEvent("campaign_optimization_applied", {
          campaignId: selectedId,
          recommendation: data.insight.recommendation,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="text-lg font-semibold">AI optimization (simulation)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suggestions are based on your latest <strong>simulated</strong> performance only. No ad accounts or
          real spend are accessed.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-xs text-muted-foreground" htmlFor="opt-campaign">
            Campaign
          </label>
          <select
            id="opt-campaign"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              setLastResult(null);
              setInsight(bestInsightFor(id));
            }}
          >
            {campaigns.length === 0 ? <option value="">No campaigns</option> : null}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || !selectedId}
            onClick={() => {
              void runOptimize(true);
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : "Optimize campaign"}
          </button>
          <button
            type="button"
            disabled={loading || !selectedId}
            onClick={() => {
              if (
                !window.confirm(
                  "Apply the recommended action? This may update the simulator and log events (still no real ad spend)."
                )
              ) {
                return;
              }
              void runOptimize(false);
            }}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Apply (not dry run)
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {(insight || lastResult?.insight) && (
        <div className="space-y-2 rounded-md bg-muted/30 p-3 text-sm">
          <p>
            <span className="font-medium">Recommendation: </span>
            <span className="font-mono text-xs">{(insight ?? lastResult?.insight)!.recommendation}</span>
          </p>
          <p>
            <span className="font-medium">Suggested action: </span>
            {(insight ?? lastResult?.insight)!.suggestedAction}
          </p>
          <p>
            <span className="font-medium">Reason: </span>
            {(insight ?? lastResult?.insight)!.reason}
          </p>
          {lastResult?.dryRun === false && lastResult.applied ? (
            <p className="text-xs text-muted-foreground">Changes applied in the simulation scope.</p>
          ) : null}
          {lastResult?.adCopySuggestion ? (
            <div className="mt-2 rounded border border-border/60 bg-background p-3 text-xs">
              <p className="font-medium">Copy suggestion</p>
              <p className="mt-1 font-medium">{lastResult.adCopySuggestion.headline}</p>
              <p className="mt-1 text-muted-foreground">{lastResult.adCopySuggestion.body}</p>
            </div>
          ) : null}
        </div>
      )}

      {initialInsights.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-medium">All campaigns (overview)</h3>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {initialInsights.map((i) => (
              <li key={i.campaignId}>
                <code className="text-[11px]">{i.platform}</code> · {i.recommendation}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
