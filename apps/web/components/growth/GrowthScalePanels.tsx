"use client";

import * as React from "react";
import { GrowthAdsRoiPanel } from "./GrowthAdsRoiPanel";
import { GrowthBrokerPerformancePanel, type BrokerPerformanceRowProps } from "./GrowthBrokerPerformancePanel";
import { GrowthForecastPanel, type GrowthForecastPanelProps } from "./GrowthForecastPanel";
import { GrowthPricingRecommendationPanel, type GrowthPricingRecommendationPanelProps } from "./GrowthPricingRecommendationPanel";

type ScalePayload = {
  brokers: BrokerPerformanceRowProps[];
  forecast: GrowthForecastPanelProps;
  pricing: GrowthPricingRecommendationPanelProps;
  ads: React.ComponentProps<typeof GrowthAdsRoiPanel>;
};

export function GrowthScalePanels() {
  const [data, setData] = React.useState<ScalePayload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/scale", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as ScalePayload & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed to load");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        if (j.brokers && j.forecast && j.pricing && j.ads) setData(j);
        else setErr("Invalid response");
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading $10K scale snapshot…</p>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err ?? "Unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-growth-scale-panels-v1>
      <GrowthForecastPanel {...data.forecast} />
      <GrowthPricingRecommendationPanel {...data.pricing} />
      <GrowthAdsRoiPanel {...data.ads} />
      <GrowthBrokerPerformancePanel brokers={data.brokers} />
    </div>
  );
}
