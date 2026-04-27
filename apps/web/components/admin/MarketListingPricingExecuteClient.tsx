"use client";

import { useState } from "react";

type ApiRow = { listingId: string; oldPrice: number; newPrice: number; adjustmentPct: number; reason: string };

export function MarketListingPricingExecuteClient() {
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    executed: number;
    skipped: number;
    changes: ApiRow[];
    dryRun?: boolean;
    disabledReason?: string;
  } | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setMessage(null);
    setResult(null);
    try {
      const r = await fetch("/api/market/pricing-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
        credentials: "same-origin",
      });
      const j = (await r.json()) as {
        error?: string;
        executed: number;
        skipped: number;
        changes: ApiRow[];
        dryRun?: boolean;
        disabledReason?: string;
      };
      if (!r.ok) {
        setError(j.error ?? "Request failed");
        return;
      }
      setResult(j);
      if (j.disabledReason) {
        setMessage(j.disabledReason);
        return;
      }
      setMessage(
        j.dryRun
          ? `Dry run: ${j.executed} would apply, ${j.skipped} skipped. No database writes.`
          : `Applied: ${j.executed} listing(s), ${j.skipped} skipped. See audit: pricing_execution_logs.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <h2 className="text-sm font-semibold text-white">Run Autonomous Pricing</h2>
      <p className="mt-2 text-xs text-zinc-500">
        Manual trigger only. Guardrails: ±15% / −10% cap, $20–$2000 / night, skip if under 2% move. Default is{" "}
        <strong>dry run</strong> (no writes). This endpoint is intended for a future{" "}
        <code className="font-mono">CRON_SECRET</code> job — not wired yet.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry run (default ON)
        </label>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">Uncheck to execute (writes + audit log)</span>
      </div>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-4 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-100 ring-1 ring-amber-500/40 transition hover:bg-amber-500/30 disabled:opacity-50"
      >
        {loading ? "Running…" : "Run Autonomous Pricing"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}
      {result && result.changes && result.changes.length > 0 ? (
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto font-mono text-xs text-zinc-400">
          {result.changes.map((c) => (
            <li key={c.listingId}>
              {c.listingId.slice(0, 8)}… {c.oldPrice} → {c.newPrice} ({c.adjustmentPct}%)
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
