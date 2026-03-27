"use client";

import { useCallback, useEffect, useState } from "react";
import type { RepricingReviewPublicDto } from "@/modules/deal-analyzer/domain/contracts";

type Props = {
  listingId: string;
  enabled: boolean;
};

export function SellerRepricingReviewCard({ listingId, enabled }: Props) {
  const [dto, setDto] = useState<RepricingReviewPublicDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/repricing-review`, {
      credentials: "include",
    });
    if (res.status === 503) return;
    if (!res.ok) return;
    const j = (await res.json()) as { repricingReview?: RepricingReviewPublicDto | null };
    setDto(j.repricingReview ?? null);
  }, [listingId]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deal-analyzer/properties/${encodeURIComponent(listingId)}/repricing-review/run`, {
        method: "POST",
        credentials: "include",
      });
      const j = (await res.json()) as { repricingReview?: RepricingReviewPublicDto | null; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Could not run review");
        return;
      }
      setDto(j.repricingReview ?? null);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-[#121212] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90">Repricing review</p>
      <p className="mt-2 text-xs text-slate-500">
        Flags when to review your ask based on platform signals. We never change your list price automatically.
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="mt-4 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
      >
        {loading ? "Evaluating…" : "Run repricing review"}
      </button>
      {err ? <p className="mt-2 text-xs text-red-300">{err}</p> : null}
      {dto ? (
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Position:</span>{" "}
            <span className="font-medium text-white">{dto.currentPosition.replace(/_/g, " ")}</span>
            {" · "}
            <span className="text-slate-500">Confidence:</span>{" "}
            <span className="text-amber-200/90">{dto.confidenceLevel}</span>
          </p>
          <p>
            <span className="text-slate-500">Suggested action:</span>{" "}
            <span className="text-white">{dto.suggestedAction.replace(/_/g, " ")}</span>
          </p>
          {dto.reasons.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-slate-400">
              {dto.reasons.map((r) => (
                <li key={r.slice(0, 48)}>{r}</li>
              ))}
            </ul>
          ) : null}
          {dto.explanation ? <p className="text-xs leading-relaxed text-slate-500">{dto.explanation}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Run to evaluate repricing signals against your listing.</p>
      )}
    </div>
  );
}
