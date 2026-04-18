"use client";

import { useState } from "react";
import type { LaunchSimulationScenario } from "@/modules/launch-simulation/launch-simulation.types";

export function AssumptionsEditor({
  scenario,
  onSaved,
}: {
  scenario: LaunchSimulationScenario;
  onSaved: () => void;
}) {
  const [json, setJson] = useState("{}");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      let patch: Record<string, unknown>;
      try {
        patch = JSON.parse(json) as Record<string, unknown>;
      } catch {
        setStatus("Invalid JSON");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/founder/simulation/assumptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, patch }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(typeof err.error === "string" ? err.error : `HTTP ${res.status}`);
        setBusy(false);
        return;
      }
      setStatus("Saved — projections updated (estimates).");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="text-sm font-medium text-zinc-200">Assumption patch (JSON)</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Partial overrides merge with defaults for <span className="text-amber-200/80">{scenario}</span>. Keys match{" "}
        <code className="text-zinc-400">LaunchSimulationAssumptions</code> (e.g.{" "}
        <code className="text-zinc-400">avgNightlyRateCad</code>, <code className="text-zinc-400">avgOccupancy</code>).
      </p>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={10}
        className="mt-3 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200 placeholder:text-zinc-600"
        placeholder='{ "avgNightlyRateCad": 140, "avgOccupancy": 0.42 }'
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Merge & persist"}
        </button>
        {status ? <span className="text-xs text-zinc-400">{status}</span> : null}
      </div>
    </div>
  );
}
