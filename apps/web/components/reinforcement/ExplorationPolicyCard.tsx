"use client";

type PolicyRow = {
  id: string;
  domain: string;
  policyType: string;
  explorationRate: number;
  isActive: boolean;
};

type Props = {
  policies: PolicyRow[];
  exploreCount: number;
  exploitCount: number;
  className?: string;
};

/**
 * Shows active bandit policy rows and aggregate explore vs exploit decision counts.
 */
export function ExplorationPolicyCard({ policies, exploreCount, exploitCount, className }: Props) {
  const total = Math.max(1, exploreCount + exploitCount);
  const explorePct = Math.round((exploreCount / total) * 1000) / 10;
  return (
    <div className={className} data-testid="reinforcement-policy-card">
      <h3 className="text-sm font-medium text-slate-200">Reinforcement policies</h3>
      <p className="mt-1 text-xs text-slate-500">
        ε-greedy or UCB-lite; exploration is bounded in code. Counts are historical decisions, not a guarantee of future mix.
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>
          Exploit: {exploitCount} ({100 - explorePct}%)
        </span>
        <span>
          Explore: {exploreCount} ({explorePct}%)
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {policies.length === 0 ? (
          <li className="text-xs text-slate-500">No active policies in DB yet (defaults apply at runtime).</li>
        ) : (
          policies.map((p) => (
            <li key={p.id} className="rounded border border-slate-700/60 bg-slate-900/40 px-2 py-1.5 text-xs text-slate-300">
              <span className="font-mono text-amber-200/90">{p.domain}</span>{" "}
              <span className="text-slate-500">· {p.policyType}</span>{" "}
              <span className="text-slate-500">· ε≈{p.explorationRate.toFixed(3)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
