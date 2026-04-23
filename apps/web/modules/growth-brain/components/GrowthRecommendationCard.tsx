import type { GrowthAction } from "../growth-brain.types";

type Props = { action: GrowthAction };

export function GrowthRecommendationCard({ action }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
          {action.actionType.replace(/_/g, " ")}
        </span>
        <span
          className={`text-[10px] uppercase ${
            action.riskLevel === "high"
              ? "text-rose-400"
              : action.riskLevel === "medium"
                ? "text-amber-300"
                : "text-emerald-400"
          }`}
        >
          {action.riskLevel} risk
        </span>
        {action.autoExecutable ? (
          <span className="text-[10px] text-sky-300">safe auto</span>
        ) : null}
        {action.approvalRequired ? (
          <span className="text-[10px] text-amber-200">approval</span>
        ) : null}
      </div>
      <p className="mt-2 font-medium text-white">{action.target}</p>
      <p className="mt-1 text-xs text-zinc-400">{action.reason}</p>
      <p className="mt-2 text-[11px] text-zinc-500">Outcome: {action.expectedOutcome}</p>
    </div>
  );
}
