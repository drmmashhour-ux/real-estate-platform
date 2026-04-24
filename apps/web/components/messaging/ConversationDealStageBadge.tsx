type Stage =
  | "new"
  | "discovery"
  | "qualified"
  | "objection_handling"
  | "visit_ready"
  | "negotiation"
  | "closing"
  | "stalled"
  | "lost_risk";

const LABEL: Record<Stage, string> = {
  new: "New",
  discovery: "Discovery",
  qualified: "Qualified",
  objection_handling: "Objection handling",
  visit_ready: "Visit ready",
  negotiation: "Negotiation",
  closing: "Closing",
  stalled: "Stalled",
  lost_risk: "At risk / cool",
};

const C: Record<Stage, string> = {
  new: "bg-slate-500/20 text-slate-200 border-slate-500/30",
  discovery: "bg-sky-500/15 text-sky-200 border-sky-500/25",
  qualified: "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
  objection_handling: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  visit_ready: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  negotiation: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/25",
  closing: "bg-rose-500/15 text-rose-200 border-rose-500/25",
  stalled: "bg-slate-600/30 text-slate-300 border-slate-500/30",
  lost_risk: "bg-rose-800/30 text-rose-200 border-rose-600/30",
};

export function ConversationDealStageBadge({
  stage,
  confidence,
  rationale,
}: {
  stage: string;
  confidence: number;
  rationale: string[];
}) {
  const s = (stage in LABEL ? stage : "new") as Stage;
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase text-slate-500">Deal stage (heuristic)</span>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${C[s]}`}>{LABEL[s]}</span>
        <span className="text-slate-500">~{Math.round(confidence * 100)}% read</span>
      </div>
      {rationale[0] ? <p className="mt-1.5 text-[11px] text-slate-400">{rationale[0]}</p> : null}
    </div>
  );
}
