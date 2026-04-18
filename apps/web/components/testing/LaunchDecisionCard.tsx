type Props = { decision: "GO" | "GO_WITH_WARNINGS" | "NO_GO" };

function cls(d: Props["decision"]) {
  if (d === "GO") return "border-emerald-500/40 bg-emerald-950/30 text-emerald-300";
  if (d === "GO_WITH_WARNINGS") return "border-amber-500/40 bg-amber-950/30 text-amber-200";
  return "border-red-500/40 bg-red-950/30 text-red-300";
}

export function LaunchDecisionCard({ decision }: Props) {
  return (
    <div className={`rounded-2xl border px-4 py-4 text-lg font-semibold ${cls(decision)}`}>
      Final decision: {decision}
    </div>
  );
}
