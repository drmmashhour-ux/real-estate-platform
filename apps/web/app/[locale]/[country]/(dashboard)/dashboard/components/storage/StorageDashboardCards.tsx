"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Analytics = {
  totalUsed: string;
  totalUsedBytes: number;
  compressionSavings: string;
  compressionSavingsBytes: number;
  compressionSavingsPercent: number;
  monthlyGrowth: string;
  monthlyGrowthBytes: number;
  monthlyGrowthPercent: number;
};

type Recommendation = {
  id: string;
  type: string;
  title: string;
  description: string;
  impactBytes?: number;
  impactPercent?: number;
  priority: string;
};

export function StorageDashboardCards() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trashCount, setTrashCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/storage/analytics", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/storage/recommendations", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/storage/trash", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([a, r, t]) => {
        if (!cancelled) {
          if (a.totalUsed != null) setAnalytics(a);
          if (Array.isArray(r.recommendations)) setRecommendations(r.recommendations);
          if (t.items) setTrashCount(t.items.length);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Total used</p>
          <p className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">
            {analytics?.totalUsed ?? "0B"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Savings from compression</p>
          <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            {analytics?.compressionSavings ?? "0B"}
          </p>
          {analytics?.compressionSavingsPercent != null && analytics.compressionSavingsPercent > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {analytics.compressionSavingsPercent}% smaller
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Files in trash</p>
          <p className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">
            {trashCount ?? 0}
          </p>
          <Link
            href="/dashboard/storage/trash"
            className="mt-1 block text-xs text-emerald-600 hover:underline dark:text-emerald-400"
          >
            View trash
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Monthly growth</p>
          <p className="mt-1 text-xl font-semibold text-slate-800 dark:text-slate-100">
            {analytics?.monthlyGrowth ?? "0B"}
          </p>
          {analytics?.monthlyGrowthPercent != null && analytics.monthlyGrowthPercent !== 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {analytics.monthlyGrowthPercent > 0 ? "+" : ""}{analytics.monthlyGrowthPercent}% vs last month
            </p>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-950/20">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Optimization &amp; alerts</h3>
          <ul className="mt-2 space-y-2">
            {recommendations.map((rec) => (
              <li key={rec.id} className="flex flex-wrap items-start gap-2 text-sm">
                <span
                  className={
                    rec.priority === "critical"
                      ? "text-red-600 dark:text-red-400"
                      : rec.priority === "high"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-600 dark:text-slate-400"
                  }
                >
                  {rec.priority === "critical" ? "🚨" : rec.priority === "high" ? "⚠️" : "💡"}{" "}
                  {rec.title}
                </span>
                <span className="text-slate-500 dark:text-slate-400">— {rec.description}</span>
                {rec.impactBytes != null && rec.impactBytes > 0 && (
                  <span className="text-xs text-slate-500">
                    Save {(rec.impactBytes / 1024).toFixed(0)} KB
                    {rec.impactPercent != null ? ` (${rec.impactPercent}%)` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/billing"
            className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Upgrade plan →
          </Link>
        </div>
      )}
    </div>
  );
}
