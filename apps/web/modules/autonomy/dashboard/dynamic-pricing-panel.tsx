"use client";

import { useState } from "react";

type PricingDecision = {
  listingId: string;
  suggestedPrice: number;
  confidence: number;
  factors: string[];
  deltaFromBase: number;
  shouldAutoApply: boolean;
  policyResults: unknown[];
};

export default function DynamicPricingPanel() {
  const [response, setResponse] = useState<PricingDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/autonomy/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          mode: "SAFE_AUTOPILOT",
          input: {
            listingId: "demo-listing-1",
            basePrice: 180,
            occupancyRate: 0.84,
            bookingVelocity: 0.76,
            localDemandIndex: 0.8,
            seasonalityIndex: 0.7,
            competitorMedianPrice: 190,
            minPrice: 120,
            maxPrice: 260,
            activePromotion: false,
          },
        }),
      });
      const data = (await res.json()) as { decision?: PricingDecision; error?: string };
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setResponse(null);
        return;
      }
      setResponse(data.decision ?? null);
    } catch {
      setError("Request failed");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4">
      <h2 className="text-lg font-semibold text-zinc-100">Dynamic pricing (demo)</h2>
      <p className="text-xs leading-relaxed text-zinc-500">
        Requires admin session and{" "}
        <span className="font-mono text-zinc-400">FEATURE_AUTONOMY_CORE_V1</span> +{" "}
        <span className="font-mono text-zinc-400">FEATURE_DYNAMIC_PRICING_V1</span>.
      </p>
      <button
        type="button"
        disabled={loading}
        className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-950/60 disabled:opacity-50"
        onClick={() => void submit()}
      >
        {loading ? "Running…" : "Run pricing decision"}
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      {response ? (
        <pre className="max-h-80 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-300">
          {JSON.stringify(response, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
