"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { UpgradeModal } from "@/src/modules/growth-funnel/ui/UpgradeModal";

type Summary = {
  riskBand: string;
  nextActions: string[];
  recommendation: string;
};

export function FirstValueFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<{ remaining: number; limit: number } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [config, setConfig] = useState<{ propertyId: string | null; configured: boolean } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const loadConfig = useCallback(() => {
    fetch("/api/growth-funnel/first-value/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ propertyId: null, configured: false }));
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function run() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setElapsedMs(null);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/growth-funnel/first-value/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("Sign in to simulate your first deal.");
        return;
      }
      if (res.status === 403 && data.error === "SIMULATOR_LIMIT") {
        setLimit({ remaining: data.remaining, limit: data.limit });
        setError("You have reached the free simulation limit. Upgrade to continue.");
        setUpgradeOpen(true);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Simulation failed");
        return;
      }
      setSummary(data.summary);
      setElapsedMs(Math.round(performance.now() - t0));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("lecipm_first_value_done", "1");
        window.dispatchEvent(new Event("lecipm-activation"));
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 text-slate-100 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A646]/90">First value</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Simulate your first deal</h2>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        One click runs the offer-strategy model on a demo listing: risk signal, next actions, and a recommended strategy.
        Target: under 60 seconds end-to-end.
      </p>
      {!config && <p className="mt-3 text-xs text-slate-500">Checking demo listing…</p>}
      {config && !config.configured && (
        <p className="mt-3 text-xs text-amber-400/90">
          No published FSBO listing found. Set <code className="text-slate-300">GROWTH_FIRST_VALUE_LISTING_ID</code> in
          env.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={run}
          disabled={loading || (config != null && !config.configured)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Running…" : "Run simulation"}
        </button>
        <Link
          href="/auth/login"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
        >
          Sign in
        </Link>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {limit && (
        <p className="mt-2 text-xs text-slate-500">
          Free tier: {limit.remaining}/{limit.limit} runs left.
        </p>
      )}
      <UpgradeModal
        open={upgradeOpen}
        valueShown
        message="You have used all free offer-strategy simulations. Upgrade for unlimited runs and AI drafts."
        onClose={() => setUpgradeOpen(false)}
        onUpgradeIntent={() => {
          void fetch("/api/growth-funnel/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventName: "upgrade_clicked",
              properties: { source: "first_value_simulator_limit" },
            }),
          });
        }}
      />
      {summary && (
        <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/30 p-4 text-sm">
          <p>
            <span className="text-slate-500">Risk signal</span>{" "}
            <span className="font-medium text-white">{summary.riskBand}</span>
          </p>
          <div>
            <p className="text-slate-500">Next actions</p>
            <ul className="mt-1 list-inside list-disc text-slate-200">
              {summary.nextActions.map((a) => (
                <li key={a.slice(0, 40)}>{a}</li>
              ))}
            </ul>
          </div>
          <p>
            <span className="text-slate-500">Recommendation</span>{" "}
            <span className="text-slate-100">{summary.recommendation}</span>
          </p>
          {elapsedMs !== null && (
            <p className="text-xs text-slate-500">
              UI round-trip: {elapsedMs} ms {elapsedMs < 60_000 ? "(within 60s target)" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
