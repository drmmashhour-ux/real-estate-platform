"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type AiData = {
  recommendations: string[];
  warnings: string[];
  predictedDaysLeft: number | null;
  savingsPotential: string;
  predictedFullDate: string | null;
  recommendation?: string;
  suggestedPlan?: string;
};

export function AiInsights() {
  const [data, setData] = useState<AiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<string | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storage/ai", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && Array.isArray(json.recommendations)) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    setOptimizeResult(null);
    try {
      const res = await fetch("/api/storage/optimize", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = await res.json().catch(() => ({}));
      setOptimizeResult(json.message ?? (json.success ? "Optimization plan created." : "Failed."));
    } finally {
      setOptimizing(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    setUpgradeResult(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          amount: 5,
          feature: "storage-upgrade",
        }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setUpgradeResult(data.error ?? "Checkout failed.");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">🧠 AI Insights</h2>
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      </section>
    );
  }

  if (!data) return null;

  const hasRecommendations = data.recommendations.length > 0;
  const hasWarnings = data.warnings.length > 0;

  return (
    <section className="rounded-xl border border-violet-500/30 bg-violet-50/50 p-6 dark:border-violet-500/20 dark:bg-violet-950/20">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">🧠 AI Insights</h2>

      {data.predictedFullDate != null && data.predictedDaysLeft != null && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <strong>Predicted full date:</strong> {data.predictedFullDate}
          {data.predictedDaysLeft !== null && (
            <span className="ml-1">
              ({data.predictedDaysLeft} day{data.predictedDaysLeft !== 1 ? "s" : ""} left at current growth)
            </span>
          )}
        </p>
      )}

      {data.savingsPotential && data.savingsPotential !== "0B" && (
        <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
          <strong>Savings potential:</strong> {data.savingsPotential}
        </p>
      )}

      {hasWarnings && (
        <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-50/80 p-3 dark:border-amber-500/30 dark:bg-amber-950/30">
          <p className="text-xs font-medium uppercase text-amber-700 dark:text-amber-300">Warnings</p>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-800 dark:text-amber-200">
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {hasRecommendations && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Recommendations</p>
          <ul className="mt-1 list-inside list-disc text-sm text-slate-700 dark:text-slate-300">
            {data.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendation === "Upgrade plan" && data.suggestedPlan === "basic" && (
        <div className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-50/80 p-3 dark:border-emerald-500/30 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">AI suggests upgrading to avoid running out of space.</p>
          <button
            type="button"
            onClick={() => handleUpgrade("basic")}
            disabled={upgrading}
            className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            {upgrading ? "Redirecting to checkout…" : "Upgrade to 5GB for $5"}
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleOptimize}
          disabled={optimizing}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
          {optimizing ? "Running…" : "Optimize storage"}
        </button>
        <Link
          href="/dashboard/storage"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Compress images
        </Link>
        <Link
          href="/dashboard/storage/trash"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Clean unused files
        </Link>
      </div>

      {optimizeResult && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{optimizeResult}</p>
      )}
      {upgradeResult && (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{upgradeResult}</p>
      )}
    </section>
  );
}
