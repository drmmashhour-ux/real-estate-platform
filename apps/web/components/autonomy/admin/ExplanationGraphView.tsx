"use client";

import type { ExplanationGraph } from "@/modules/autonomous-marketplace/explainability/explainability.types";

export function ExplanationGraphView(props: { graph: ExplanationGraph }) {
  const { nodes, edges } = props.graph;
  if (nodes.length === 0 && edges.length === 0) {
    return (
      <p className="text-xs text-zinc-500">No graph nodes — insufficient preview signals.</p>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-premium-gold">Nodes</p>
        <ul className="mt-2 space-y-2">
          {nodes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[11px] text-zinc-300"
            >
              <span className="font-mono text-[10px] text-zinc-500">{n.type}</span>
              <span className="ml-2 text-zinc-100">{n.title}</span>
              <p className="mt-1 text-zinc-500">{n.description}</p>
              {n.references && n.references.length > 0 ? (
                <p className="mt-1 font-mono text-[10px] text-zinc-600">{n.references.join(" · ")}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-premium-gold">Edges</p>
        <ul className="mt-2 space-y-2">
          {edges.map((e, i) => (
            <li key={`${e.from}-${e.to}-${i}`} className="text-[11px] text-zinc-400">
              <span className="font-mono text-zinc-500">{e.from}</span>
              <span className="mx-1 text-premium-gold">→</span>
              <span className="font-mono text-zinc-500">{e.to}</span>
              <p className="mt-0.5 text-zinc-500">{e.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
