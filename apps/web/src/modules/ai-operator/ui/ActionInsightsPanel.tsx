"use client";

import { useCallback, useEffect, useState } from "react";

export function ActionInsightsPanel() {
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lecipm/ai-operator/insights");
      const data = await res.json();
      setByStatus(data.byStatus ?? {});
      setNote(data.learningNote ?? null);
    } catch {
      setByStatus({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const entries = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Learning loop</h2>
        <button type="button" onClick={() => void load()} className="text-xs text-premium-gold hover:underline">
          Refresh
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Counts by outcome — tune rules from approve vs reject ratios.</p>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading…</p> : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-lg font-semibold text-white">{v}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-3 text-[11px] text-slate-500">{note}</p> : null}
    </section>
  );
}
