"use client";

import { useEffect, useMemo, useState } from "react";
import type { ListingPreviewResponse } from "@/modules/autonomous-marketplace/types/listing-preview.types";
import { ListingPreviewSummaryCard } from "./ListingPreviewSummaryCard";
import { ListingPreviewSignalsTable } from "./ListingPreviewSignalsTable";
import { ListingPreviewOpportunitiesCard } from "./ListingPreviewOpportunitiesCard";
import { ListingPreviewPolicyCard } from "./ListingPreviewPolicyCard";
import { ListingPreviewActionsCard } from "./ListingPreviewActionsCard";
import { ListingPreviewExplanationGraph } from "./ListingPreviewExplanationGraph";

const GOLD = "#D4AF37";

export function ListingPreviewPanel({
  initialListingId,
}: {
  initialListingId?: string | null;
}) {
  const [listingId, setListingId] = useState(initialListingId ?? "");
  const [preview, setPreview] = useState<ListingPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = listingId.trim();

  const fetchPreview = async () => {
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/autonomy/preview?listingId=${encodeURIComponent(trimmed)}`, {
        credentials: "same-origin",
      });
      const body = (await res.json()) as { preview?: ListingPreviewResponse | null; error?: string };
      if (!res.ok) {
        setError(body.error ?? "Unable to load preview.");
        setPreview(null);
      } else {
        setPreview(body.preview ?? null);
      }
    } catch {
      setError("Unable to load preview.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialListingId?.trim()) {
      void fetchPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial scope only
  }, []);

  const explanation = preview?.previewExplanation ?? null;

  const keyFindings = useMemo(() => explanation?.keyFindings ?? [], [explanation]);

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#0d0d0d] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Listing preview simulation</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Read-only DRY_RUN preview — deterministic signals and policies; nothing executes automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="Listing id"
            className="min-w-[200px] rounded-lg border border-zinc-700 bg-black px-3 py-2 text-xs text-zinc-200"
          />
          <button
            type="button"
            onClick={() => void fetchPreview()}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-black"
            style={{ backgroundColor: GOLD }}
          >
            Load preview
          </button>
        </div>
      </div>

      {loading ? <p className="mt-4 text-xs text-zinc-500">Loading preview…</p> : null}
      {error ? <p className="mt-4 text-xs text-red-400">{error}</p> : null}

      {preview ? (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500">
            <span>flags.realPreview: {String(preview.flags?.realPreviewEnabled ?? false)}</span>
            <span>·</span>
            <span>flags.explainability: {String(preview.flags?.explainabilityEnabled ?? false)}</span>
            <span>·</span>
            <span>execution: {preview.executionResult.status}</span>
          </div>

          <ListingPreviewSummaryCard metrics={preview.metrics} />
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Signals</h3>
            <ListingPreviewSignalsTable signals={preview.signals} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Opportunities</h3>
            <ListingPreviewOpportunitiesCard opportunities={preview.opportunities} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Policy decisions</h3>
            <ListingPreviewPolicyCard decisions={preview.policyDecisions} />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Proposed actions</h3>
            <ListingPreviewActionsCard actions={preview.proposedActions} />
          </div>

          {explanation ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Explainability summary
              </h3>
              <p className="rounded-lg border border-zinc-800 bg-[#111] p-3 text-xs text-zinc-300">{explanation.summary}</p>
              {keyFindings.length ? (
                <ul className="mt-3 space-y-2 text-xs text-zinc-400">
                  {keyFindings.map((k) => (
                    <li key={k.id} className="rounded border border-zinc-800 bg-[#111] p-2">
                      <span className="font-medium text-zinc-200">{k.label}</span>
                      <p className="mt-1">{k.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4">
                <h4 className="mb-2 text-[11px] font-semibold text-zinc-500">Cause graph</h4>
                <ListingPreviewExplanationGraph explanation={explanation} />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        !loading &&
        !error && <p className="mt-4 text-xs text-zinc-600">Enter a listing id to load preview.</p>
      )}
    </section>
  );
}
