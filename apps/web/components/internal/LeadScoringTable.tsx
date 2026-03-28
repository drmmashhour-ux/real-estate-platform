"use client";

import { useEffect, useState } from "react";

type Row = {
  userId: string;
  email: string | null;
  name: string | null;
  score: number;
  category: "low" | "medium" | "high";
};

export function LeadScoringTable({ className }: { className?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/internal/leads?take=30", { credentials: "include" });
        const j = (await res.json()) as { error?: string; leads?: Row[] };
        if (!res.ok) {
          setError(j.error ?? `HTTP ${res.status}`);
          return;
        }
        if (!cancelled) setRows(j.leads ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 text-sm text-slate-400 ${className ?? ""}`}>Loading lead scores…</div>;
  }
  if (error) {
    return (
      <div className={`rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-200 ${className ?? ""}`}>
        Lead scoring unavailable: {error}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-[#0f0f0f] p-6 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-premium-gold/90">Lead scoring (deterministic)</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-500">
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2">Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b border-white/5">
                <td className="py-2 pr-4 text-slate-200">{r.email ?? r.userId.slice(0, 8)}</td>
                <td className="py-2 pr-4 font-mono text-white">{r.score}</td>
                <td className="py-2">
                  <span
                    className={
                      r.category === "high"
                        ? "text-emerald-400"
                        : r.category === "medium"
                          ? "text-premium-gold"
                          : "text-slate-400"
                    }
                  >
                    {r.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="mt-4 text-slate-500">No users to score.</p> : null}
      </div>
    </div>
  );
}
