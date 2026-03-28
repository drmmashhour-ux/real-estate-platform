import type { LeadSelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";

export function BestLeadCard({ lead }: { lead: LeadSelectionResult }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-medium text-white">{lead.leadName}</p>
      <p className="mt-1 text-xs text-slate-300">Priority {lead.score} · Urgency {lead.urgency}</p>
      <p className="mt-2 text-xs text-slate-400">{lead.reasons[0]}</p>
      <p className="mt-2 text-xs text-premium-gold">Action: {lead.recommendedAction.replace(/_/g, " ")}</p>
    </div>
  );
}
