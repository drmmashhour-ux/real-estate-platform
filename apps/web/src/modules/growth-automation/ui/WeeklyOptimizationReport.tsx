"use client";

import { useEffect, useState } from "react";

export function WeeklyOptimizationReport() {
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const weekStart = new Date().toISOString().slice(0, 10);
    fetch(`/api/growth/report/weekly?weekStart=${encodeURIComponent(weekStart)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRaw(JSON.stringify(d.report, null, 2));
      })
      .catch(() => setError("Failed to load report"));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 lg:col-span-2">
      <h3 className="text-sm font-semibold text-white">Weekly optimization report</h3>
      <p className="mt-1 text-xs text-slate-500">
        Taxonomy insights, channel notes, and recommendations in one snapshot (performance-driven).
      </p>
      <pre className="mt-2 max-h-64 overflow-auto text-xs text-slate-400">{raw ?? "…"}</pre>
    </div>
  );
}
