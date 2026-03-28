"use client";

export type PipelineColumnId = "new" | "in_progress" | "negotiation" | "closing" | "completed";

export type PipelineCard = { id: string; dealCode: string | null; status: string; brokerId: string | null };

const LABELS: Record<PipelineColumnId, string> = {
  new: "New",
  in_progress: "In progress",
  negotiation: "Negotiation",
  closing: "Closing",
  completed: "Completed",
};

export type DealPipelineBoardProps = {
  columns: Record<PipelineColumnId, PipelineCard[]>;
};

export function DealPipelineBoard({ columns }: DealPipelineBoardProps) {
  const order: PipelineColumnId[] = ["new", "in_progress", "negotiation", "closing", "completed"];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[880px] gap-3">
        {order.map((key) => (
          <div key={key} className="flex-1 rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-premium-gold/90">
              {LABELS[key]}{" "}
              <span className="font-normal text-slate-500">({columns[key]?.length ?? 0})</span>
            </div>
            <ul className="max-h-[420px] space-y-2 overflow-y-auto p-2">
              {(columns[key] ?? []).map((d) => (
                <li
                  key={d.id}
                  className="rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"
                >
                  <div className="font-medium text-slate-100">{d.dealCode || d.id.slice(0, 8)}</div>
                  <div className="text-xs text-slate-500">{d.status}</div>
                </li>
              ))}
              {(columns[key] ?? []).length === 0 ? (
                <li className="px-2 py-6 text-center text-xs text-slate-600">No deals</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
