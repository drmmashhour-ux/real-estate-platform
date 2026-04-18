"use client";

import * as React from "react";
import type { GrowthAgentCoordinationResult } from "@/modules/growth/growth-agents.types";

function severityBadge(s: "low" | "medium" | "high"): string {
  if (s === "high") return "border-rose-500/40 bg-rose-950/30 text-rose-100";
  if (s === "medium") return "border-amber-500/40 bg-amber-950/25 text-amber-100";
  return "border-zinc-600 bg-zinc-900/60 text-zinc-300";
}

function agentBadge(agentId: string): string {
  return "rounded border border-cyan-800/60 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200/90";
}

export function GrowthMultiAgentPanel() {
  const [data, setData] = React.useState<GrowthAgentCoordinationResult | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/agents/coordination", { credentials: "same-origin" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Coordination load failed");
        return j as GrowthAgentCoordinationResult;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Loading multi-agent coordination…</p>;

  const top = data.topPriorities.slice(0, 5);

  return (
    <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/15 p-4">
      <h3 className="text-sm font-semibold text-cyan-100">🤝 Multi-Agent Coordination</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Specialist proposals only — no auto-execution. Conflicts and alignments are advisory.
      </p>

      <div className="mt-4 border-t border-cyan-900/35 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Top priorities</p>
        <ul className="mt-2 space-y-3">
          {top.map((p) => (
            <li key={p.id} className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-100">{p.title}</span>
                <span className={agentBadge(p.agentId)}>{p.agentId}</span>
                <span className="text-[10px] uppercase text-zinc-500">{p.impact}</span>
                <span className="text-[10px] text-zinc-500">conf {(p.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">{p.rationale.slice(0, 220)}</p>
            </li>
          ))}
        </ul>
      </div>

      {data.conflicts.length > 0 ? (
        <div className="mt-4 border-t border-cyan-900/35 pt-3">
          <p className="text-[11px] font-semibold uppercase text-rose-400/90">Conflicts</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {data.conflicts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start gap-2">
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${severityBadge(c.severity)}`}>
                  {c.severity}
                </span>
                <span>{c.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.alignments.length > 0 ? (
        <div className="mt-4 border-t border-cyan-900/35 pt-3">
          <p className="text-[11px] font-semibold uppercase text-emerald-400/90">Alignments</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
            {data.alignments.map((a) => (
              <li key={a.id}>
                <strong className="text-zinc-300">{a.theme}</strong> — confidence {(a.confidence * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 border-t border-cyan-900/35 pt-3">
        <p className="text-[11px] font-semibold uppercase text-zinc-500">Coordination note</p>
        <p className="mt-1 text-xs text-zinc-400">{data.notes[0] ?? "—"}</p>
      </div>

      <p className="mt-3 text-[11px] text-zinc-600">
        No automatic enforcement — advisory + human review. Source systems stay authoritative.
      </p>
    </div>
  );
}
