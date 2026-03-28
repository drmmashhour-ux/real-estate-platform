type QueueItem = {
  documentId: string;
  title: string;
  property: string;
  status: string;
  riskLevel: "low" | "medium" | "high" | "unknown";
  completionPercent: number;
  updatedAt: string;
  contradictionCount: number;
  warningCount: number;
};

export function ApprovalQueueItem({ item, selected, onSelect }: { item: QueueItem; selected: boolean; onSelect: (id: string) => void }) {
  const riskClass = item.riskLevel === "high" ? "text-rose-200" : item.riskLevel === "medium" ? "text-amber-200" : "text-emerald-200";
  return (
    <button
      type="button"
      onClick={() => onSelect(item.documentId)}
      className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-premium-gold/60 bg-premium-gold/10" : "border-white/10 bg-black/25 hover:bg-black/35"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="text-xs text-slate-400">{item.property}</p>
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase text-slate-300">{item.status.replace(/_/g, " ")}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
        <span className={riskClass}>Risk: {item.riskLevel}</span>
        <span className="text-slate-300">{item.completionPercent}% complete</span>
        <span className="text-slate-500">Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
      </div>
    </button>
  );
}
