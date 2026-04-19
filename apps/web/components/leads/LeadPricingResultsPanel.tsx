"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  LeadPricingOutcomeSummary,
  LeadPricingResultsAdminPayload,
} from "@/modules/leads/lead-pricing-results.types";

export function LeadPricingResultsPanel({
  leadId,
  payload,
  onRefresh,
}: {
  leadId: string;
  payload: LeadPricingResultsAdminPayload | null | undefined;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localOutcome, setLocalOutcome] = useState<LeadPricingOutcomeSummary | null>(
    payload?.outcomeSummary ?? null,
  );

  useEffect(() => {
    setLocalOutcome(payload?.outcomeSummary ?? null);
  }, [payload]);

  const snapshot = payload;
  const outcome = localOutcome ?? snapshot?.outcomeSummary ?? null;

  const runEvaluate = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/pricing-results`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          observationId: snapshot?.latestObservationId ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { outcomeSummary?: LeadPricingOutcomeSummary; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not evaluate observation.");
        return;
      }
      if (data.outcomeSummary) setLocalOutcome(data.outcomeSummary);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }, [leadId, onRefresh, snapshot?.latestObservationId]);

  if (!snapshot || (!snapshot.latestObservationId && !outcome)) {
    return (
      <section className="mt-6 rounded-2xl border border-amber-500/25 bg-[#181008] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">Measurement</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Lead pricing results</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          No advisory observation recorded yet for this lead. Overrides and experiment views can create observations when
          the measurement layer is enabled — outcomes stay descriptive and non-causal.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-amber-500/30 bg-[#181008] p-5 shadow-[0_0_0_1px_rgba(245,158,11,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">Measurement</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lead pricing results</h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Conservative readout vs. the snapshot taken when pricing mode was observed — does not imply that price
            changes caused pipeline movement.
          </p>
        </div>
        {snapshot.latestObservationId ? (
          <button
            type="button"
            onClick={() => void runEvaluate()}
            disabled={busy}
            className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/50 disabled:opacity-50"
          >
            {busy ? "Scoring…" : "Persist evaluation now"}
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

      {outcome ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Band</p>
              <p className="mt-1 font-semibold capitalize text-white">{outcome.outcomeBand.replace(/_/g, " ")}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Mode observed</p>
              <p className="mt-1 font-semibold text-white">{outcome.pricingModeUsed.replace(/_/g, " ")}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Window</p>
              <p className="mt-1 tabular-nums text-slate-200">
                {outcome.window.days} day{outcome.window.days === 1 ? "" : "s"} elapsed
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">{outcome.explanation}</p>
          {outcome.warnings.length > 0 ? (
            <ul className="list-inside list-disc text-xs text-amber-100/90">
              {outcome.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Load lead detail to refresh the latest scored summary.</p>
      )}
    </section>
  );
}
