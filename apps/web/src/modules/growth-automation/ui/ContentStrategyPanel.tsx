"use client";

import { useEffect, useState } from "react";

export function ContentStrategyPanel() {
  const [raw, setRaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/growth/taxonomy?planDate=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRaw(JSON.stringify(d, null, 2));
      })
      .catch(() => setError("Failed to load taxonomy"));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <h3 className="text-sm font-semibold text-white">Content taxonomy & channel strategy</h3>
      <p className="mt-1 text-xs text-slate-500">
        Five pillars, platform allowlists, and last-7-day rotation counts (no random slot assignment in daily plans).
      </p>
      <pre className="mt-2 max-h-56 overflow-auto text-xs text-slate-400">{raw ?? "…"}</pre>
    </div>
  );
}
