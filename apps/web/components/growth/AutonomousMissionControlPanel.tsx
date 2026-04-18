"use client";

import * as React from "react";

import type { AutonomousDecision, AutonomousSystemState } from "@/modules/autonomous/autonomous-marketplace.types";
import type { AutonomousExecutionLogEntry } from "@/modules/autonomous/autonomous-execution.service";

type Payload = {
  decisions: AutonomousDecision[];
  status: AutonomousSystemState["status"];
  logs?: AutonomousExecutionLogEntry[];
  note?: string;
  error?: string;
};

export function AutonomousMissionControlPanel() {
  const [data, setData] = React.useState<Payload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    void fetch("/api/growth/autonomous-marketplace", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as Payload;
        if (!r.ok) throw new Error(j.error ?? "Failed");
        return j;
      })
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function submit(decisionId: string, approved: boolean) {
    setPendingId(decisionId);
    setErr(null);
    try {
      const res = await fetch("/api/growth/autonomous-marketplace/execute", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId, approved }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Execute failed");
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setPendingId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-500">Loading autonomous marketplace…</p>
      </div>
    );
  }
  if (err && !data) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }
  if (!data?.decisions) {
    return null;
  }

  return (
    <section
      className="rounded-xl border border-purple-900/50 bg-purple-950/20 p-4"
      data-growth-autonomous-marketplace-v1
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-300/90">
            Autonomous marketplace (V1)
          </p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Mission control</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            {data.note ??
              "Assistive only — approvals write audit logs. No auto-send, spend, or production pricing changes."}
          </p>
        </div>
        <span className="rounded-full border border-zinc-700 px-2 py-1 text-[11px] uppercase text-zinc-400">
          Status: {data.status}
        </span>
      </div>

      {err ? <p className="mt-2 text-sm text-amber-300">{err}</p> : null}

      <ul className="mt-4 space-y-3">
        {data.decisions.map((d) => (
          <li key={d.id} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase text-purple-400/90">{d.domain}</span>
              <span className="text-[11px] text-zinc-500">
                {(d.confidence * 100).toFixed(0)}% conf · {d.impact} impact
                {d.requiresApproval ? " · approval" : ""}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-200">{d.action}</p>
            <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
              {d.rationale.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pendingId === d.id}
                className="rounded-md border border-emerald-800/60 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
                onClick={() => void submit(d.id, true)}
              >
                Approve (log)
              </button>
              <button
                type="button"
                disabled={pendingId === d.id}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                onClick={() => void submit(d.id, false)}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>

      {data.logs && data.logs.length > 0 ? (
        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recent logs</p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto font-mono text-[10px] text-zinc-500">
            {data.logs.slice(0, 15).map((l) => (
              <li key={`${l.at}-${l.decisionId}-${l.outcome}`}>
                {l.at} · {l.decisionId} · {l.outcome} — {l.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
