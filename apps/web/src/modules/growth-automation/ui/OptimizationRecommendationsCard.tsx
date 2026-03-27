"use client";

import { useEffect, useState } from "react";

export function OptimizationRecommendationsCard() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/growth/recommendations")
      .then((r) => r.json())
      .then((d) => setText(JSON.stringify(d.recommendations, null, 2)))
      .catch(() => setText("{}"));
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Optimization</h3>
      <p className="mt-1 text-xs text-slate-500">Hooks, timing hints, topic mix from stored metrics.</p>
      <pre className="mt-2 max-h-48 overflow-auto text-xs text-slate-400">{text ?? "…"}</pre>
    </div>
  );
}
