"use client";

import { useState, useEffect } from "react";

type StatusData = {
  used: string;
  limit: string;
  percent: number;
  status: "safe" | "warning" | "critical" | "full";
  usedBytes: number;
  limitBytes: number;
};

function barColorClass(status: string): string {
  if (status === "full" || status === "critical") return "bg-red-500 dark:bg-red-500";
  if (status === "warning") return "bg-amber-500 dark:bg-amber-500";
  return "bg-emerald-500 dark:bg-emerald-500";
}

export function StorageUsageBar() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/storage/status", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.used != null) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading storage…
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const percent = Math.min(100, data.percent);
  const barWidth = `${percent}%`;
  const colorClass = barColorClass(data.status);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>Storage used</span>
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {data.used} / {data.limit}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Storage used: ${data.used} of ${data.limit}`}
      >
        <div
          className={`h-full rounded-full transition-[width] ${colorClass}`}
          style={{ width: barWidth }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {percent}% used · Free plan 500MB · Upgrade for more
      </p>
    </div>
  );
}
