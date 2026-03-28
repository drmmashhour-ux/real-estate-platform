"use client";

import { useState } from "react";
import { ActionQueuePanel } from "@/src/modules/ai-operator/ui/ActionQueuePanel";
import { AutonomousSettingsPanel } from "@/src/modules/ai-operator/ui/AutonomousSettingsPanel";
import { ActionInsightsPanel } from "@/src/modules/ai-operator/ui/ActionInsightsPanel";
import { AI_OPERATOR_CONTEXTS } from "@/src/modules/ai-operator/domain/operator.enums";

/** Personal ingest UI — team/org mode uses `/api/workspaces/[id]/lecipm/ai-operator/team-ingest`. */
const PERSONAL_INGEST_CONTEXTS = AI_OPERATOR_CONTEXTS.filter(
  (c) => c !== "team_workspace" && c !== "monopoly_learning"
);

export function AICommandCenter() {
  const [ctx, setCtx] = useState<(typeof PERSONAL_INGEST_CONTEXTS)[number]>("deal_analysis");
  const [snapshotJson, setSnapshotJson] = useState('{"dealScore":62,"trustScore":70}');
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);

  async function runIngest() {
    let snapshot: Record<string, unknown> = {};
    try {
      snapshot = snapshotJson.trim() ? (JSON.parse(snapshotJson) as Record<string, unknown>) : {};
    } catch {
      setIngestMsg("Invalid JSON snapshot");
      return;
    }
    setIngesting(true);
    setIngestMsg(null);
    try {
      const res = await fetch("/api/lecipm/ai-operator/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx, snapshot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      setIngestMsg(`Created ${data.proposals} proposal(s) — mode ${data.mode}.`);
      window.dispatchEvent(new Event("lecipm-ai-operator-refresh"));
    } catch (e) {
      setIngestMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/90">LECIPM</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">AI Operator</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Centralized suggestions with explicit reasons. Execution is policy-gated: no auto messaging, no auto billing, no destructive
          writes from this layer.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h2 className="text-sm font-semibold text-white">Test ingest</h2>
        <p className="mt-1 text-xs text-slate-500">Simulate triggers (same API used by product integrations).</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            value={ctx}
            onChange={(e) => setCtx(e.target.value as typeof ctx)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {PERSONAL_INGEST_CONTEXTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={ingesting}
            onClick={() => void runIngest()}
            className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:bg-[#d4b456] disabled:opacity-50"
          >
            {ingesting ? "Running…" : "Generate actions"}
          </button>
        </div>
        <textarea
          value={snapshotJson}
          onChange={(e) => setSnapshotJson(e.target.value)}
          className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-200"
          rows={4}
        />
        {ingestMsg ? <p className="mt-2 text-xs text-slate-400">{ingestMsg}</p> : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionQueuePanel />
        <div className="space-y-4">
          <AutonomousSettingsPanel />
          <ActionInsightsPanel />
        </div>
      </div>
    </div>
  );
}
