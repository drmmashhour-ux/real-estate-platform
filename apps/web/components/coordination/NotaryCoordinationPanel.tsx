"use client";

import { useEffect, useState } from "react";

export function NotaryCoordinationPanel({ dealId, onError }: { dealId: string; onError: (e: string | null) => void }) {
  const [data, setData] = useState<{
    readinessScore: number;
    checklist: { key: string; label: string; done: boolean }[];
    disclaimer?: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${encodeURIComponent(dealId)}/notary`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) onError(j.error);
        else setData({ readinessScore: j.readinessScore, checklist: j.checklist ?? [], disclaimer: j.disclaimer });
      })
      .catch(() => onError("Notary coordination load failed"));
  }, [dealId, onError]);

  if (!data) return <p className="text-sm text-slate-500">Loading notary workspace…</p>;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-lg font-medium text-slate-100">Notary package readiness</h2>
      {data.disclaimer ? <p className="mt-1 text-xs text-slate-500">{data.disclaimer}</p> : null}
      <p className="mt-2 text-sm text-slate-300">
        Readiness estimate: <span className="text-emerald-300">{data.readinessScore}%</span>
      </p>
      <ul className="mt-2 space-y-1 text-sm text-slate-400">
        {data.checklist.map((c) => (
          <li key={c.key}>
            {c.done ? "✓" : "○"} {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
