"use client";

export type ArmRow = {
  strategyKey: string;
  domain: string;
  contextBucket: string;
  pulls: number;
  avgReward: number | null;
  wins: number;
  losses?: number;
  stalls?: number;
};

type Props = {
  title: string;
  arms: ArmRow[];
  className?: string;
};

/**
 * Per-(strategy, domain, context bucket) running stats.
 */
export function StrategyArmTable({ title, arms, className }: Props) {
  return (
    <div className={className} data-testid="reinforcement-arm-table">
      <h3 className="text-sm font-medium text-slate-200">{title}</h3>
      <div className="mt-2 max-h-56 overflow-auto rounded border border-slate-700/50">
        <table className="w-full min-w-[32rem] text-left text-xs text-slate-300">
          <thead className="sticky top-0 bg-slate-900/90 text-slate-400">
            <tr>
              <th className="px-2 py-1.5 font-normal">Domain</th>
              <th className="px-2 py-1.5 font-normal">Strategy</th>
              <th className="px-2 py-1.5 font-normal">Context bucket</th>
              <th className="px-2 py-1.5 font-normal">Pulls</th>
              <th className="px-2 py-1.5 font-normal">Avg r</th>
              <th className="px-2 py-1.5 font-normal">W</th>
            </tr>
          </thead>
          <tbody>
            {arms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-3 text-slate-500">
                  No arm stats yet.
                </td>
              </tr>
            ) : (
              arms.map((a) => (
                <tr key={`${a.domain}-${a.strategyKey}-${a.contextBucket}`} className="border-t border-slate-800/80">
                  <td className="px-2 py-1.5 font-mono text-amber-200/80">{a.domain}</td>
                  <td className="px-2 py-1.5 max-w-[10rem] truncate" title={a.strategyKey}>
                    {a.strategyKey}
                  </td>
                  <td className="px-2 py-1.5 max-w-[16rem] truncate text-slate-500" title={a.contextBucket}>
                    {a.contextBucket}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">{a.pulls}</td>
                  <td className="px-2 py-1.5 tabular-nums">{a.avgReward == null ? "—" : a.avgReward.toFixed(3)}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {a.wins}
                    {typeof a.losses === "number" || typeof a.stalls === "number" ? (
                      <span className="text-slate-500">
                        {" "}
                        / {a.losses ?? 0} / {a.stalls ?? 0}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
