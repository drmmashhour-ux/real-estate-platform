type R = { key: string; label: string; level: "low" | "medium" | "high"; rationale: string[] };

const L: Record<"low" | "medium" | "high", string> = {
  low: "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-200/90 border-amber-500/20",
  high: "bg-rose-500/10 text-rose-200/90 border-rose-500/20",
};

export function ConversationRiskHeatmap({
  overallRisk,
  riskScore,
  risks,
}: {
  overallRisk: "low" | "medium" | "high";
  riskScore: number;
  risks: R[];
}) {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase text-slate-500">Conversation risk (heuristic)</span>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${L[overallRisk]}`}>
          {overallRisk} · score {riskScore}
        </span>
      </div>
      <p className="text-[10px] text-slate-500">Not a credit, legal, or background risk — conversation-flow hints only.</p>
      <ul className="max-h-40 space-y-1.5 overflow-y-auto">
        {risks.map((r) => (
          <li key={r.key} className="rounded border border-white/5 bg-white/[0.03] p-1.5">
            <p className="font-medium text-slate-200">{r.label}</p>
            <p className="text-[10px] text-slate-500">{r.rationale[0]}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
