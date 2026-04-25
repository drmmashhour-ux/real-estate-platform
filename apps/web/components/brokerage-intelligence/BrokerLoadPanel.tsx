"use client";

import type { BrokerLoadEntry } from "@/modules/brokerage-intelligence/brokerage-intelligence.types";

type Props = {
  load: BrokerLoadEntry[];
  rebalancing: { suggestions: { targetBrokerId: string; action: string; rationale: string }[]; rationale: string[] };
  className?: string;
};

export function BrokerLoadPanel({ load, rebalancing, className }: Props) {
  return (
    <div className={className} data-testid="broker-load-panel">
      <h3 className="text-sm font-medium text-slate-200">Broker load (heuristic)</h3>
      <p className="mt-1 text-xs text-slate-500">Not a personal judgment; for capacity planning only.</p>
      <div className="mt-2 max-h-48 overflow-auto text-xs text-slate-300">
        {load.length === 0 ? <p className="text-slate-500">No load rows yet.</p> : null}
        {load.map((b) => (
          <div key={b.brokerId} className="border-b border-slate-800/80 py-1.5">
            <span className="font-mono text-[10px] text-slate-500">{b.brokerId.slice(0, 10)}…</span> deals {b.activeDeals} / leads {b.activeLeads}{" "}
            <span className="text-amber-200/80">load~{b.workloadScore.toFixed(0)}</span>
          </div>
        ))}
      </div>
      {rebalancing.suggestions.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-200/80">
          {rebalancing.suggestions.map((s) => (
            <li key={s.targetBrokerId}>{s.action} — {s.rationale}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
