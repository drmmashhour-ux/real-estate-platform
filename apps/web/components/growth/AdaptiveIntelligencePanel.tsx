"use client";

/**
 * Approval-only adaptive suggestions — local “approve” is a checklist tick, not execution.
 */

import * as React from "react";
import type { AdaptiveDecision } from "@/modules/growth/adaptive-intelligence.types";
import { presetAndScrollToActionSimulation } from "./growth-action-simulation-preset";

type Snapshot = {
  decisions: AdaptiveDecision[];
  generatedAt: string;
  note: string;
};

const priorityBadge: Record<string, string> = {
  critical: "bg-rose-900/50 text-rose-100 border-rose-800/60",
  high: "bg-amber-900/45 text-amber-100 border-amber-800/55",
  medium: "bg-slate-800/80 text-slate-200 border-slate-700",
};

type PanelProps = { simulateOutcomeEnabled?: boolean };

const ADAPTIVE_TO_SIM: Record<
  AdaptiveDecision["category"],
  "demand_generation" | "timing_focus" | "retention_focus" | "routing_shift" | "city_domination"
> = {
  growth: "demand_generation",
  timing: "timing_focus",
  retention: "retention_focus",
  routing: "routing_shift",
  closing: "demand_generation",
};

export function AdaptiveIntelligencePanel({ simulateOutcomeEnabled = false }: PanelProps) {
  const [data, setData] = React.useState<Snapshot | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [approved, setApproved] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(() => {
    void fetch("/api/growth/adaptive-intelligence", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Snapshot & { error?: string };
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setData({ decisions: j.decisions ?? [], generatedAt: j.generatedAt, note: j.note });
        setErr(null);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const copyDecision = React.useCallback((d: AdaptiveDecision) => {
    const block = [
      `${d.priority.toUpperCase()} · ${d.category}`,
      d.action,
      "",
      d.reason,
      "",
      "Signals:",
      ...d.supportingSignals.map((s) => `• ${s}`),
      "",
      "Why it matters:",
      d.whyItMatters,
    ].join("\n");
    void navigator.clipboard.writeText(block).then(() => {
      setCopiedId(d.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    });
  }, []);

  const toggleApprove = React.useCallback((id: string) => {
    setApproved((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (err) {
    return (
      <div className="rounded-xl border border-amber-900/45 bg-amber-950/15 p-4 text-sm text-amber-100/90">
        <p className="font-semibold text-amber-50">Adaptive intelligence</p>
        <p className="mt-2">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-500">
        Loading adaptive snapshot…
      </div>
    );
  }

  return (
    <section
      id="growth-mc-adaptive-intelligence"
      className="scroll-mt-24 rounded-xl border border-violet-900/45 bg-violet-950/20 p-4"
      data-growth-adaptive-intelligence-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">
            What should we do now?
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-50">Adaptive growth intelligence</h3>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-zinc-500">{data.note}</p>
          <p className="mt-1 text-[10px] text-zinc-600">
            Generated {new Date(data.generatedAt).toLocaleString()} · suggestion-only · no auto-send or pricing writes
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-violet-700/60 px-2 py-1 text-xs text-violet-100 hover:bg-violet-950/60"
          onClick={() => load()}
        >
          Refresh
        </button>
      </div>

      {data.decisions.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No prioritized suggestions right now — CRM/growth signals may be sparse. Enable more pipelines or check back after
          activity.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.decisions.map((d) => (
            <li key={d.id} className="rounded-lg border border-zinc-800 bg-black/25 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityBadge[d.priority] ?? priorityBadge.medium}`}
                >
                  {d.priority}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">{d.category}</span>
                <span className="text-[10px] text-zinc-600">
                  confidence {d.confidence} · approval required
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-100">{d.action}</p>
              <p className="mt-1 text-xs text-zinc-400">{d.reason}</p>
              <ul className="mt-2 space-y-0.5 text-[11px] text-zinc-500">
                {d.supportingSignals.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] leading-snug text-violet-200/80">{d.whyItMatters}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900"
                  onClick={() => copyDecision(d)}
                >
                  {copiedId === d.id ? "Copied" : "Copy"}
                </button>
                {simulateOutcomeEnabled ? (
                  <button
                    type="button"
                    className="rounded border border-violet-800/70 px-2 py-1 text-[11px] text-violet-200/90 hover:bg-violet-950/50"
                    onClick={() =>
                      presetAndScrollToActionSimulation({
                        title: d.action.slice(0, 200),
                        category: ADAPTIVE_TO_SIM[d.category],
                        rationale: d.reason.slice(0, 800),
                        windowDays: 14,
                        intensity: d.priority === "critical" ? "high" : d.priority === "high" ? "medium" : "low",
                      })
                    }
                  >
                    Simulate outcome
                  </button>
                ) : null}
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-400">
                  <input
                    type="checkbox"
                    checked={!!approved[d.id]}
                    onChange={() => toggleApprove(d.id)}
                    className="rounded border-zinc-600"
                  />
                  Approve (local checklist only)
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
