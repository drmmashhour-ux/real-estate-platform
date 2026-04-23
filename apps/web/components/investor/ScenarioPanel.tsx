"use client";

import { useState } from "react";

export default function ScenarioPanel({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function createScenario() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/investor/scenarios/create", {
        method: "POST",
        body: JSON.stringify({
          investorAnalysisCaseId: caseId,
          scenarioName: "5-Year Growth",
          annualAppreciationRate: 0.04,
          exitYear: 5,
          saleCostRate: 0.05,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `Failed (${res.status})`);
        return;
      }
      setMessage("Scenario saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4 text-white">
      <div className="text-lg text-[#D4AF37] font-semibold">Scenario Builder</div>
      <div className="mt-2 text-sm text-white/60">Model appreciation, exit timing, and sale costs.</div>

      <button
        type="button"
        onClick={() => void createScenario()}
        className="mt-4 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Creating…" : "Add 5-Year Growth Scenario"}
      </button>
      {message ? <p className="mt-2 text-sm text-white/55">{message}</p> : null}
    </div>
  );
}
