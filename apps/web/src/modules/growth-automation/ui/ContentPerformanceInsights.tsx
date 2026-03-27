"use client";

import { useEffect, useState } from "react";

export function ContentPerformanceInsights() {
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/growth/recommendations")
      .then((r) => r.json())
      .then((d) =>
        setRaw(
          JSON.stringify(
            {
              topTopics: d.recommendations?.topTopics,
              topHooks: d.recommendations?.topHooks,
              topPlatforms: d.recommendations?.topPlatforms,
              taxonomyMix: d.recommendations?.taxonomyMix,
            },
            null,
            2,
          ),
        ),
      )
      .catch(() => setRaw("{}"));
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Content performance insights</h3>
      <p className="mt-1 text-xs text-slate-500">Top topics, hooks, platforms, and taxonomy mix from stored metrics.</p>
      <pre className="mt-2 max-h-48 overflow-auto text-xs text-slate-400">{raw ?? "…"}</pre>
    </div>
  );
}
