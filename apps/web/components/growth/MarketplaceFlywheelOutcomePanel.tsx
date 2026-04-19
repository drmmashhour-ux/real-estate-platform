"use client";

import { useCallback, useEffect, useState } from "react";
import type { FlywheelActionWithLatestOutcome } from "@/modules/growth/flywheel-action.types";

function scoreStyle(score: string): string {
  switch (score) {
    case "positive":
      return "text-emerald-300";
    case "negative":
      return "text-rose-300";
    case "insufficient_data":
      return "text-amber-300";
    default:
      return "text-slate-300";
  }
}

export function MarketplaceFlywheelOutcomePanel({
  outcomesEnabled,
}: {
  outcomesEnabled: boolean;
}) {
  const [actions, setActions] = useState<FlywheelActionWithLatestOutcome[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/marketplace-flywheel/actions", { credentials: "same-origin" });
    const data = (await res.json().catch(() => ({}))) as { actions?: FlywheelActionWithLatestOutcome[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not load outcomes.");
      return;
    }
    setActions(Array.isArray(data.actions) ? data.actions : []);
    setError("");
  }, []);

  useEffect(() => {
    if (!outcomesEnabled) return;
    void load();
  }, [load, outcomesEnabled]);

  const evaluate = async (id: string) => {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/admin/marketplace-flywheel/actions/${id}/evaluate`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Evaluate failed.");
      setBusy(null);
      return;
    }
    await load();
    setBusy(null);
  };

  if (!outcomesEnabled) return null;

  return (
    <section className="mt-6 rounded-2xl border border-indigo-500/25 bg-[#0d1020] p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/90">Learning</p>
        <h3 className="mt-1 text-lg font-semibold text-white">Outcome snapshots</h3>
        <p className="mt-1 max-w-2xl text-xs text-slate-400">
          Compare baseline (at action creation) vs current rolling 30d metrics. Run manually — does not bill or execute
          campaigns.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">{error}</p>
      ) : null}

      <div className="mt-5 space-y-4">
        {actions.length === 0 ? (
          <p className="text-sm text-slate-500">Create an action first, then evaluate after the advisory window.</p>
        ) : (
          actions.map((a) => (
            <div key={a.id} className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-indigo-200">{a.type}</span>
                <button
                  type="button"
                  disabled={busy !== null}
                  className="rounded-lg border border-indigo-500/40 px-3 py-1 text-[11px] font-medium text-indigo-200 hover:bg-indigo-950/50 disabled:opacity-50"
                  onClick={() => void evaluate(a.id)}
                >
                  {busy === a.id ? "Recording…" : "Evaluate now"}
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Baseline (at creation)</p>
                  <p className="mt-1 tabular-nums">
                    Brokers {a.baselineBrokers} · Leads30 {a.baselineLeads30} · Listings {a.baselineListings}
                  </p>
                  <p className="mt-1 tabular-nums text-slate-500">
                    Unlock {(a.baselineUnlockRate * 100).toFixed(1)}% · Win {(a.baselineConversionRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Latest outcome</p>
                  {a.latestOutcome ? (
                    <>
                      <p className={`mt-1 font-semibold ${scoreStyle(a.latestOutcome.outcomeScore)}`}>
                        {a.latestOutcome.outcomeScore.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1 tabular-nums text-slate-400">
                        Δ brokers {a.latestOutcome.brokerCountDelta} · leads30 {a.latestOutcome.leadCountDelta} · listings{" "}
                        {a.latestOutcome.listingCountDelta}
                      </p>
                      <p className="mt-1 tabular-nums text-slate-400">
                        Δ unlock {(a.latestOutcome.unlockRateDelta * 100).toFixed(2)} pp · Δ win{" "}
                        {(a.latestOutcome.conversionRateDelta * 100).toFixed(2)} pp
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{a.latestOutcome.explanation}</p>
                      <p className="mt-1 text-[10px] text-slate-600">
                        {new Date(a.latestOutcome.measuredAt).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-slate-500">No evaluation recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
