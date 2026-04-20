"use client";

import { useEffect, useState } from "react";
import type { ListingExplanation } from "@/modules/autonomous-marketplace/explainability/explainability.types";
import { ExplanationFindingsList } from "./ExplanationFindingsList";
import { ExplanationGraphView } from "./ExplanationGraphView";
import { ExplanationRecommendations } from "./ExplanationRecommendations";
import { ExplanationSummaryCard } from "./ExplanationSummaryCard";

type ExplainApiResponse = {
  explanation: ListingExplanation | null;
  userSafeReasoningSummary?: string | null;
  disabled?: boolean;
  error?: string;
  freshness?: string;
};

export function ExplainabilityPanel(props: {
  listingId: string;
  level?: "simple" | "detailed" | "debug";
  onClose: () => void;
}) {
  const [data, setData] = useState<ExplainApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({ listingId: props.listingId });
    if (props.level) q.set("level", props.level);
    setLoading(true);
    fetch(`/api/admin/autonomy/explain?${q.toString()}`, { method: "GET", credentials: "same-origin" })
      .then((r) => r.json())
      .then((j: ExplainApiResponse) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {
        if (!cancelled) setData({ explanation: null, error: "fetch_failed" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [props.listingId, props.level]);

  const ex = data?.explanation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-premium-gold/30 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-premium-gold">
              AI reasoning (deterministic)
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Preview explainability</h2>
            <p className="mt-1 font-mono text-[11px] text-zinc-500">Listing {props.listingId}</p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg border border-white/15 px-3 py-1 text-xs text-zinc-300 hover:bg-white/5"
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-500">Loading read-only explanation…</p>
        ) : data?.disabled ? (
          <p className="mt-6 text-sm text-amber-200/90">
            Explainability is disabled. Set <code className="rounded bg-black/50 px-1">FEATURE_AUTONOMY_EXPLAINABILITY_V1</code>.
          </p>
        ) : !ex ? (
          <p className="mt-6 text-sm text-zinc-500">
            No explanation available (preview may have returned no structured path).
            {data?.error ? ` (${data.error})` : ""}
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            <ExplanationSummaryCard summary={ex.summary} level={ex.level} />
            {data.userSafeReasoningSummary ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-400">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Safe summary</p>
                <p className="mt-1 text-zinc-300">{data.userSafeReasoningSummary}</p>
              </div>
            ) : null}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Key findings</p>
              <div className="mt-2">
                <ExplanationFindingsList findings={ex.keyFindings} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Reasoning graph</p>
              <div className="mt-2">
                <ExplanationGraphView graph={ex.graph} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Recommendations</p>
              <div className="mt-2">
                <ExplanationRecommendations items={ex.recommendations} />
              </div>
            </div>
          </div>
        )}

        {data?.freshness ? (
          <p className="mt-6 text-[10px] text-zinc-600">Freshness: {data.freshness}</p>
        ) : null}
      </div>
    </div>
  );
}
