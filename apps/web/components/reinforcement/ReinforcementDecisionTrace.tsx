"use client";

type Dec = {
  id: string;
  domain: string;
  strategyKey: string;
  selectionMode: string;
  contextBucket: string;
  createdAt: string;
};

type Props = {
  recent: Dec[];
  className?: string;
};

/**
 * Recent auditable bandit draws (suggestion order only).
 */
export function ReinforcementDecisionTrace({ recent, className }: Props) {
  return (
    <div className={className} data-testid="reinforcement-decision-trace">
      <h3 className="text-sm font-medium text-slate-200">Recent reinforced decisions</h3>
      <p className="mt-1 text-xs text-slate-500">Audit IDs for ranking; does not imply messages were sent.</p>
      <ul className="mt-2 max-h-48 space-y-1.5 overflow-auto text-xs">
        {recent.length === 0 ? (
          <li className="text-slate-500">No rows yet.</li>
        ) : (
          recent.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded border border-slate-800/80 bg-slate-900/30 px-2 py-1.5 text-slate-300"
            >
              <span className="font-mono text-[10px] text-slate-500">{d.id.slice(0, 12)}…</span>
              <span className="font-mono text-amber-200/80">{d.domain}</span>
              <span
                className={d.selectionMode === "explore" ? "text-amber-400" : "text-slate-400"}
              >
                {d.selectionMode}
              </span>
              <span className="max-w-full truncate" title={d.strategyKey}>
                {d.strategyKey}
              </span>
              <span className="ml-auto text-slate-500">{new Date(d.createdAt).toLocaleString()}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
