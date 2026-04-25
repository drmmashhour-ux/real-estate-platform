"use client";

import { useCallback, useState } from "react";
import type { ExpansionScenarioOutput } from "@/modules/investor-intelligence/investor-intelligence.types";

export function ScenarioSimulatorPanel() {
  const [out, setOut] = useState<ExpansionScenarioOutput | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(() => {
    setLoading(true);
    setErr(null);
    void fetch("/api/investor/scenarios", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        marketKey: "QC|MTL",
        action: "increase_broker_capacity",
        assumptions: { capacityDeltaPct: 10 },
        persist: true,
      }),
    })
      .then((r) => r.json() as Promise<{ ok?: boolean; result?: ExpansionScenarioOutput; error?: string }>)
      .then((j) => {
        if (j.ok && j.result) setOut(j.result);
        else setErr(j.error ?? "Failed");
      })
      .catch(() => setErr("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4" data-testid="scenario-sim">
      <h3 className="text-sm font-medium text-slate-800">What-if (sample run)</h3>
      <p className="text-xs text-slate-500">Edit inputs in a future form; this runs a single bounded example.</p>
      <button
        type="button"
        onClick={run}
        className="mt-2 rounded bg-slate-900 px-3 py-1.5 text-xs text-white"
        disabled={loading}
      >
        {loading ? "Running…" : "Run sample scenario"}
      </button>
      {err ? <p className="mt-2 text-xs text-rose-600">{err}</p> : null}
      {out ? (
        <div className="mt-3 text-xs text-slate-700">
          <p className="font-medium">{out.rationale[0]}</p>
          <p className="text-slate-500">{out.disclaimer}</p>
        </div>
      ) : null}
    </div>
  );
}
