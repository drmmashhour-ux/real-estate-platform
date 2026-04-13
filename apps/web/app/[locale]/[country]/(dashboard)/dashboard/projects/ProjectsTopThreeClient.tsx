"use client";

import { useEffect, useState } from "react";

type Item = { projectId: string; rank: number; reason: string; score: number };

export function ProjectsTopThreeClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/projects")
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Top 3 opportunities</h2>
        <p className="mt-2 text-slate-500">Loading…</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-white">Top 3 opportunities</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.projectId} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Rank #{item.rank}</p>
            <p className="mt-1 text-sm text-slate-400">{item.reason}</p>
            <p className="mt-2 text-sm text-teal-400">Score {item.score}/100</p>
          </div>
        ))}
      </div>
    </section>
  );
}
