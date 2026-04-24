export function ClosingReadinessCard({
  score,
  label,
  rationale,
}: {
  score: number;
  label: "not_ready" | "progressing" | "near_closing";
  rationale: string[];
}) {
  const text =
    label === "near_closing" ? "Near a next-step window (heuristic)" : label === "not_ready" ? "Early / exploratory" : "Progressing";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-xs">
      <p className="text-[10px] font-semibold uppercase text-slate-500">Closing readiness (not a guarantee)</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-emerald-200">{score}</span>
        <span className="text-slate-400">/ 100</span>
        <span className="text-slate-300">· {text}</span>
      </div>
      {rationale[0] ? <p className="mt-1 text-[10px] text-slate-500">{rationale[0]}</p> : null}
    </div>
  );
}
