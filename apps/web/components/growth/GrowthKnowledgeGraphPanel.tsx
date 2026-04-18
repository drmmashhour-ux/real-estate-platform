"use client";

import * as React from "react";
import type { GrowthKnowledgeEdge, GrowthKnowledgeGraph } from "@/modules/growth/growth-knowledge-graph.types";

function edgeLabel(t: GrowthKnowledgeEdge["type"]): string {
  return t.replace(/_/g, " ");
}

export function GrowthKnowledgeGraphPanel() {
  const [graph, setGraph] = React.useState<GrowthKnowledgeGraph | null>(null);
  const [insights, setInsights] = React.useState<string[] | undefined>(undefined);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/knowledge-graph", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; graph?: GrowthKnowledgeGraph; insights?: string[] };
        if (!r.ok) throw new Error(j.error ?? "Knowledge graph unavailable");
        if (!cancelled) {
          setInsights(Array.isArray(j.insights) ? j.insights : undefined);
        }
        return j.graph ?? null;
      })
      .then((g) => {
        if (!cancelled) {
          setGraph(g);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setErr(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading knowledge graph…</p>;
  }
  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!graph) {
    return null;
  }

  const conflicts = graph.edges.filter((e) => e.type === "conflicts_with").slice(0, 6);
  const keyEdges = graph.edges.slice(0, 5);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  return (
    <section className="rounded-xl border border-indigo-900/45 bg-indigo-950/15 p-4" aria-label="Growth knowledge graph">
      <h3 className="text-sm font-semibold text-indigo-100">🕸 Growth Knowledge Graph</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Advisory relationships from current signals — text summary only (no graph DB). Not authoritative.
      </p>

      {insights && insights.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 rounded-lg border border-indigo-800/40 bg-indigo-950/25 p-3 text-xs text-indigo-100/95">
          {insights.slice(0, 6).map((line, i) => (
            <li key={`kg-insight-${i}`}>{line}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
        <span>
          Nodes: <strong className="text-zinc-200">{graph.summary.nodeCount}</strong>
        </span>
        <span>
          Edges: <strong className="text-zinc-200">{graph.summary.edgeCount}</strong>
        </span>
      </div>
      {graph.summary.dominantThemes.length > 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          Themes: {graph.summary.dominantThemes.slice(0, 6).join(", ")}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Recurring blockers</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {graph.summary.recurringBlockers.slice(0, 3).map((t) => (
              <li key={t}>{t}</li>
            ))}
            {graph.summary.recurringBlockers.length === 0 ? (
              <li className="text-zinc-600">None surfaced</li>
            ) : null}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Winning patterns</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-300">
            {graph.summary.repeatedWinners.slice(0, 3).map((t) => (
              <li key={t}>{t}</li>
            ))}
            {graph.summary.repeatedWinners.length === 0 ? (
              <li className="text-zinc-600">None surfaced</li>
            ) : null}
          </ul>
        </div>
      </div>

      {keyEdges.length > 0 ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Key relationships</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {keyEdges.map((e) => {
              const from = nodeById.get(e.fromId);
              const to = nodeById.get(e.toId);
              return (
                <li key={e.id} className="text-zinc-300">
                  <span className="text-zinc-500">{from?.title ?? e.fromId}</span>{" "}
                  <span className="text-indigo-300">→ {edgeLabel(e.type)} →</span>{" "}
                  <span className="text-zinc-500">{to?.title ?? e.toId}</span>
                  <span className="mt-0.5 block text-zinc-500">{e.rationale}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {conflicts.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600/90">Conflicts</p>
          <ul className="mt-2 space-y-1 text-xs text-amber-100/90">
            {conflicts.map((e) => {
              const from = nodeById.get(e.fromId);
              const to = nodeById.get(e.toId);
              return (
                <li key={e.id}>
                  {from?.title ?? "?"} ↔ {to?.title ?? "?"} — {e.rationale}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
