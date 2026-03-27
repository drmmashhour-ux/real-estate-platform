import { useMemo, useState } from "react";
import { ApprovalQueueItem } from "@/src/modules/legal-workflow/ui/ApprovalQueueItem";

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

export function ApprovalQueueList({ items, selectedId, onSelect }: { items: QueueItem[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated" | "risk" | "completion">("updated");

  const filtered = useMemo(() => {
    let out = statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter);
    out = [...out].sort((a, b) => {
      if (sortBy === "completion") return b.completionPercent - a.completionPercent;
      if (sortBy === "risk") {
        const rank = { high: 3, medium: 2, low: 1, unknown: 0 } as const;
        return rank[b.riskLevel] - rank[a.riskLevel];
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return out;
  }, [items, statusFilter, sortBy]);

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In review</option>
          <option value="needs_changes">Needs changes</option>
          <option value="approved">Approved</option>
          <option value="finalized">Finalized</option>
          <option value="exported">Exported</option>
          <option value="signed">Signed</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white">
          <option value="updated">Sort: updated</option>
          <option value="risk">Sort: risk</option>
          <option value="completion">Sort: completion</option>
        </select>
      </div>
      <div className="space-y-2">
        {filtered.length ? filtered.map((item) => (
          <ApprovalQueueItem key={item.documentId} item={item} selected={selectedId === item.documentId} onSelect={onSelect} />
        )) : <p className="text-xs text-slate-500">No documents in queue.</p>}
      </div>
    </div>
  );
}
