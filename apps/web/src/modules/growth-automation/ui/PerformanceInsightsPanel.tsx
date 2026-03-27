"use client";

import { useEffect, useState } from "react";

export function PerformanceInsightsPanel() {
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/growth/performance")
      .then((r) => r.json())
      .then((d) => setRaw(JSON.stringify(d.metrics?.slice(0, 12) ?? [], null, 2)))
      .catch(() => setRaw("[]"));
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Performance (recent)</h3>
      <p className="mt-1 text-xs text-slate-500">Ingest via POST /api/growth/performance (admin).</p>
      <pre className="mt-2 max-h-48 overflow-auto text-xs text-slate-400">{raw ?? "…"}</pre>
    </div>
  );
}
