"use client";

import { useEffect, useState } from "react";

export function GrowthFunnelMetricsPanel() {
  const [raw, setRaw] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/growth-funnel/metrics?days=30")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setRaw(JSON.stringify(d.metrics, null, 2));
      })
      .catch(() => setErr("Failed"));
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Growth funnel (30d)</h3>
      <p className="mt-1 text-xs text-slate-500">Activation, retention, conversion from stored funnel events.</p>
      <pre className="mt-2 max-h-64 overflow-auto text-xs text-slate-400">{raw ?? "…"}</pre>
    </div>
  );
}
