"use client";

export type DecisionResult = {
  recommendedAction: string;
  riskScore: number;
  trustScore: number;
  trustLevel: string;
  factors: string[];
  fraudAction?: string;
};

type AiDecisionPanelProps = {
  queueItemId: string | null;
  type: string;
  entityId: string;
  decision: DecisionResult | null;
  loading: boolean;
  onRefreshDecision: () => void;
};

export function AiDecisionPanel({
  queueItemId,
  type,
  entityId,
  decision,
  loading,
  onRefreshDecision,
}: AiDecisionPanelProps) {
  if (!queueItemId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-500 dark:text-slate-400">Select a queue item to see AI recommendation and take action.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Decision</h3>
        <button
          type="button"
          onClick={onRefreshDecision}
          disabled={loading}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {loading ? "Running…" : "Re-run AI"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {type} · {entityId.slice(0, 8)}…
      </p>

      {loading && !decision && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Evaluating…</p>
      )}

      {decision && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Recommended</span>
              <p
                className={`font-semibold ${
                  decision.recommendedAction === "block"
                    ? "text-red-600 dark:text-red-400"
                    : decision.recommendedAction === "approve"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {decision.recommendedAction}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Risk score</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{decision.riskScore}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Trust</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {decision.trustScore} ({decision.trustLevel})
              </p>
            </div>
            {decision.fraudAction && (
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Fraud</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{decision.fraudAction}</p>
              </div>
            )}
          </div>
          {decision.factors.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Factors</span>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-600 dark:text-slate-400">
                {decision.factors.slice(0, 8).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
