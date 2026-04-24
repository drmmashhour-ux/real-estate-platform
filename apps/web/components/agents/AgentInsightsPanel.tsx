"use client";

import type { CoordinationRunResult } from "@/modules/agents/agent.types";

type Props = {
  data: CoordinationRunResult | null;
  loading?: boolean;
  error?: string | null;
};

export function AgentInsightsPanel({ data, loading, error }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
        Running agent coordination…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>
    );
  }
  if (!data) {
    return null;
  }

  const { policy } = data;

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#D4AF37]">Agent insights</h3>
        <span className="text-xs text-white/50">v{data.orchestratorVersion}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <PolicyPill label="Allowed" active={policy.allowed} tone="emerald" />
        <PolicyPill label="Human approval" active={policy.requiresHumanApproval} tone="amber" />
        <PolicyPill label="Blocked" active={policy.blocked} tone="red" />
      </div>

      <p className="text-xs text-white/55">
        Aggregated confidence: <span className="text-white/90">{data.aggregated.confidenceScore}</span> · Proposals
        enqueued: {data.enqueuedTaskIds.length}
      </p>

      {data.aggregated.conflicts.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-200/90">Conflicts</p>
          <ul className="list-inside list-disc text-xs text-white/75">
            {data.aggregated.conflicts.map((c) => (
              <li key={c.id}>{c.summary}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-medium text-white/70">Per-agent decisions</p>
        <ul className="space-y-3">
          {data.decisions.map((d) => (
            <li key={`${d.agentType}-${d.decisionType}`} className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium text-[#D4AF37]">{d.agentType}</span>
                <span className="text-white/50">{(d.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="mt-1 text-white/55">{d.decisionType}</p>
              <p className="mt-2 whitespace-pre-wrap text-white/80">{d.reasoning}</p>
            </li>
          ))}
        </ul>
      </div>

      {data.aggregated.actions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-white/70">Recommended actions (queued as proposals)</p>
          <ul className="space-y-2 text-xs text-white/80">
            {data.aggregated.actions.map((a) => (
              <li key={`${a.agentType}-${a.kind}`} className="rounded border border-white/10 px-2 py-1">
                <span className="text-[#D4AF37]">{a.agentType}</span> · {a.kind}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PolicyPill({
  label,
  active,
  tone,
}: {
  label: string;
  active: boolean;
  tone: "emerald" | "amber" | "red";
}) {
  const cls =
    tone === "emerald"
      ? active
        ? "bg-emerald-500/20 text-emerald-200"
        : "bg-white/5 text-white/35"
      : tone === "amber"
        ? active
          ? "bg-amber-500/20 text-amber-200"
          : "bg-white/5 text-white/35"
        : active
          ? "bg-red-500/20 text-red-200"
          : "bg-white/5 text-white/35";
  return <span className={`rounded-full px-2 py-0.5 ${cls}`}>{label}</span>;
}
