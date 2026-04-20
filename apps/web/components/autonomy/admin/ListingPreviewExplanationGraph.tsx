import type { ListingPreviewExplanation } from "@/modules/autonomous-marketplace/explainability/preview-explainability.types";

export function ListingPreviewExplanationGraph({
  explanation,
}: {
  explanation: ListingPreviewExplanation | null | undefined;
}) {
  if (!explanation?.graph?.nodes?.length) {
    return (
      <p className="rounded-lg border border-zinc-800 bg-[#0a0a0a] p-3 text-xs text-zinc-500">No explanation graph.</p>
    );
  }

  const { nodes, edges } = explanation.graph;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Nodes ({nodes.length})</h4>
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
          {nodes.map((n) => (
            <li key={n.id} className="rounded border border-zinc-800 bg-[#111] p-2">
              <span className="font-mono text-[10px] text-amber-200/80">{n.kind}</span>
              <p className="font-medium text-zinc-200">{n.label}</p>
              <p className="text-[10px] text-zinc-500">{n.detail.slice(0, 160)}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Edges ({edges.length})</h4>
        <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-xs">
          {edges.map((e, idx) => (
            <li key={`${e.fromId}-${e.toId}-${idx}`} className="rounded border border-zinc-800 bg-[#111] p-2 text-zinc-400">
              <span className="font-mono text-[10px] text-zinc-600">
                {e.fromId} → {e.toId}
              </span>
              <p className="mt-1 text-[11px] text-zinc-400">{e.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
